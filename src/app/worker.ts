import { ipcRenderer } from "electron"
import path from "path"
import { existsSync } from "fs"
import { sanhelper } from "./sanhelper"
import { log } from "./log"
import { sanconfig } from "./config"
import { cachedata, checkunlockstatus, getachievementicon, cacheachievementicons } from "./achievement"
import { getGamePath } from "steam-game-path"

declare global {
    interface Window {
        client: any
        cachedata: any
    }
}

log.init("WORKER")
sanhelper.errorhandler(log)

const startidle = () => {
    log.write("INFO","Idle loop started")
    
    const timer = setInterval(() => {
        const { pollrate, maxretries } = sanconfig.get().store

        const { appid, gamename } = sanhelper.gameinfo as AppInfo
        if (!appid) return

        clearInterval(timer)

        const appinfo: AppInfo = {
            appid: appid,
            gamename: gamename,
            pollrate: typeof pollrate !== "number" ? 250 : (pollrate < 50 ? 50 : pollrate),
            maxretries: maxretries
        }

        typeof pollrate !== "number" && log.write("ERROR",`"pollrate" has invalid type of "${typeof pollrate}" - setting to default value (250ms)...`) 
        pollrate < 50 && log.write("ERROR",`Minimum "pollrate" exceeded (${pollrate}ms) - setting to default value (50ms)`)

        startsan(appinfo)
    },1000)
}

const creategameinfo = (gamename: string, appid: number, exepath: string, pid: number, pollrate: number) => [
    "Game process started:",
    `gamename: ${gamename}`,
    `appid: ${appid}`,
    `exepath: ${exepath}`,
    `pid: ${pid}`,
    `pollrate: ${pollrate}ms`
].join("\n-")

const startsan = async (appinfo: AppInfo) => {
    const { appid, gamename, pollrate, maxretries } = appinfo
    const { init } = await import("steamworks.js")

    const client = init(appid)
    sanhelper.devmode && (window.client = client)

    const steam3id = client.localplayer.getSteamId().accountId
    const steam64id = client.localplayer.getSteamId().steamId64.toString().replace(/n$/,"")

    const cachedicons = await cacheachievementicons(gamename || "???",steam64id,appid)

    const getprocessinfo = (sgpexe?: string): ProcessInfo[] => {
        const processinfo: ProcessInfo[] = []
        const linkedgame: string | undefined = sgpexe || Object.entries(localStorage).find(item => parseInt(item[0]) === appid)?.[1]

        linkedgame && log.write("INFO",`${sgpexe ? `"steam-game-path"` : "Linked Game"} executable found for AppID "${appid}": "${linkedgame}"`)

        client.processes.getGameProcesses(appid,linkedgame ? path.basename(linkedgame) : null).forEach(({ exe, pid }: ProcessInfo) => {
            processinfo.push({
                pid: pid,
                exe: exe
            } as ProcessInfo)
        })

        return processinfo
    }

    const processes: ProcessInfo[] = []

    const initgameloop = () => {
        processes.forEach(({ pid,exe }: ProcessInfo) => log.write("INFO",creategameinfo(gamename || "",appid,exe,pid,pollrate || 250)))

        ipcRenderer.send("appid",appid,gamename)
        ipcRenderer.on("steamss",() => ipcRenderer.send("steamss",steam3id))
    
        const apinames: string[] = client.achievement.getAchievementNames()
        let cache: Achievement[] = cachedata(client,apinames)
        
        const gameloop = () => {
            if (processes.every(({ pid }: ProcessInfo) => pid !== -1 && !sanhelper.isprocessrunning(pid))) {
                clearInterval(timer!)
                log.write("INFO","Game loop stopped")
    
                ipcRenderer.send("validateworker")
            }
    
            const live: Achievement[] = cachedata(client,apinames)
            const unlocked = checkunlockstatus(cache,live)
            sanhelper.devmode && (window.cachedata = live)
        
            if (!unlocked.length) return
    
            sanhelper.devmode && log.write("INFO",JSON.stringify(unlocked))
    
            let hasshown = false
    
            unlocked.forEach(async (achievement: Achievement) => {
                log.write("INFO",`Achievement unlocked: ${JSON.stringify(achievement)}`)
    
                const config = sanconfig.get()
                const { rarity } = config.store
                const type = achievement.percent <= rarity ? "rare" : "main"
    
                let retries = 0
    
                const achievementicon = async (): Promise<string | null> => {
                    let icon: string | null = null
                    const cachedicon = path.join(sanhelper.temp,`${achievement.apiname}.jpg`)
    
                    try {
                        icon = existsSync(cachedicon) ? cachedicon : await getachievementicon(client,achievement)
                        if (!icon) throw new Error(`Icon for ${achievement.apiname} is null. Retrying....`)
    
                        log.write("INFO",`Icon for ${achievement.apiname} saved successfully`)
                        return icon.replace(/\\/g,"/")
                    } catch (err) {
                        log.write("ERROR",err as string)
    
                        retries++
                        retries < 5 ? setTimeout(() => achievementicon(),100) : log.write("ERROR",`Failed to fetch icon for ${achievement.apiname}`)
    
                        return null
                    }
                }
    
                const icon = config.get(`customisation.${type}.usegameicon`) ? path.join(await sanhelper.steampath,"appcache","librarycache",`${appid}_icon.jpg`) : await achievementicon()
    
                const notify: Notify = {
                    id: Math.round(Date.now() / Math.random() * 1000),
                    customisation: config.get(`customisation.${type}`) as Customisation,
                    type: type,
                    gamename: gamename || "???",
                    apiname: achievement.apiname,
                    name: achievement.name,
                    desc: achievement.desc,
                    unlocked: achievement.unlocked,
                    hidden: achievement.hidden,
                    percent: achievement.percent,
                    icon: icon || sanhelper.setfilepath("img","sanlogosquare.svg")
                }
    
                ipcRenderer.send("notify",notify)
    
                if (live.every(ach => ach.unlocked) && !hasshown) {
                    const { plat } = (config.get(`customisation.plat`) as Customisation).customicons as CustomIcon
    
                    const platnotify: Notify = {
                        id: Date.now(),
                        customisation: config.get(`customisation.plat`) as Customisation,
                        type: "plat",
                        gamename: gamename || "???",
                        apiname: "PLAT_NOTIFICATION",
                        name: "100%",
                        desc: "",
                        unlocked: true,
                        hidden: false,
                        percent: 0,
                        icon: plat || sanhelper.setfilepath("img","ribbon.svg")
                    }
    
                    ipcRenderer.send("notify",platnotify)
                    hasshown = true
                }
            })
    
            cache = cachedata(client,apinames)
        }
    
        const timer: NodeJS.Timeout = setInterval(gameloop,pollrate || 250)
    }

    let retries = 0

    const getrunninggameprocesses = async () => {
        const processinfo: ProcessInfo[] = getprocessinfo()

        if (!processinfo.length) {
            if (retries < (maxretries || 10)) {
                log.write("ERROR",`No running processes found for "${gamename}" - Retrying...`)
                retries++

                setTimeout(getrunninggameprocesses,1000)
                return
            } else {
                // If no processes are found by automatic process tracking or by manually adding a Linked Game, use "steam-game-path" as a last resort fallback
                // This could potentially replace the `get_game_exes()` Rust function if it turns out to be more accurate, but is a lot slower, due to waiting for the `SteamUser` dependency of `steam-game-path` to parse `appinfo.vdf`
                log.write("ERROR",`No matching game processes found via automatic process tracking or Linked Games. Checking for executable using "steam-game-path"...`)

                const exes = async () => (await (getGamePath(appid,true)?.game)?.executable as any[]).filter(({ executable }: any) => path.extname(executable) === (process.platform === "win32" ? ".exe" : ""))    

                for (const exe of await exes()) {
                    await (async () => {
                        const processinfo: ProcessInfo[] = getprocessinfo(exe.executable)
                        processinfo.length && processes.push(...processinfo)
                    })()
                }

                // If an EXE is still not found, push an invalid process. The user will then need to manually release the game
                if (!processes.length) {
                    log.write("ERROR",`Unable to find running game process for "${gamename}": Game will not be able to quit automatically!`)
                    
                    processes.push({
                        exe: "<Unknown>",
                        pid: -1
                    } as ProcessInfo)
                }
            }
        } else {
            processes.push(...processinfo)
        }

        initgameloop()
    }
        
    getrunninggameprocesses()
}

startidle()