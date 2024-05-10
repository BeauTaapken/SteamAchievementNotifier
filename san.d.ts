declare interface Display extends Electron.Display {
    primary: boolean
}

declare interface Monitor {
    id: number,
    label: string,
    primary: boolean,
    bounds: {
        width: number,
        height: number
    },
    scaleFactor: number
}

declare interface Res {
    msg: string,
    dims: {
        width: number,
        height: number,
        offset: number
    }
}

interface SANHelper {
    [key: string]: function | boolean | number | string | Promise<any> | undefined
}

declare interface Config {
    lang: string,
    desktop: boolean,
    startwin: boolean,
    startmin: boolean,
    nohwa: boolean,
    litemode: boolean,
    rarity: number,
    soundonly: boolean,
    showpercent: "rareonly" | "all" | "off",
    extwin: boolean,
    audiosrc: "notify" | "app" | "off",
    nowtracking: boolean,
    nowtrackingscale: number,
    shortcuts: boolean,
    steamss: boolean,
    screenshots: "off" | "overlay" | "notifyimg",
    monitor: number,
    monitors: Monitor[],
    ssdelay: number,
    ovpath: string,
    imgpath: string,
    noanim: boolean,
    nvda: boolean,
    tooltips: boolean,
    notifydebug: boolean,
    pollrate: number,
    maxretries: number,
    releasedelay: number,
    width: number,
    height: number,
    x: number,
    y: number,
    usecustomfiles: boolean,
    customisation: {
        main: Customisation,
        rare: Customisation,
        plat: Customisation,
        [key: string]: object
    },
    [key: string]: string | number | boolean | object
}

declare interface Customisation {
    soundmode: "file" | "folder",
    soundfile: string,
    sounddir: string,
    volume: number,
    preset: string,
    displaytime: number,
    scale: number,
    customtext: string,
    usegametitle: boolean,
    bgstyle: "solid" | "gradient" | "bgimg" | "gameart",
    gradientangle: number,
    bgimg: string,
    bgimgbrightness: number,
    brightness: number,
    roundness: number,
    fontsize: number,
    opacity: number,
    bgonly: boolean,
    fontcolor: string,
    fontoutline: boolean,
    fontoutlinecolor: string,
    fontshadow: boolean,
    fontshadowcolor: string,
    iconroundness: number,
    usegameicon: boolean,
    customicons: { [key: string]: CustomIcon | string },
    showdecoration: boolean,
    pos: "bottomcenter" | "topcenter" | "topleft" | "topright" | "bottomleft" | "bottomright",
    usecustompos: boolean,
    custompos: {
        x: number,
        y: number
    },
    animdir: "up" | "down" | "left" | "right",
    ovpos: "bottomcenter" | "topcenter" | "topleft" | "topright" | "bottomleft" | "bottomright",
    ovmatch: boolean,
    alldetails: boolean,
    primarycolor: string,
    secondarycolor: string,
    tertiarycolor: string,
    gameart: string,
    shortcut: string,
    customfont: string
    iconanim?: boolean,
    showhiddenicon: boolean,
    replacelogo: boolean,
    hiddenicon: string,
    previewhiddenicon: boolean,
    usepercent: boolean,
    usertheme: Button[],
    [key: string]: string | number | boolean | object
}

declare interface CustomIcon {
    [key: string]: string,
    logo: string | string[] | null,
    decoration: string | string[] | null,
    plat?: string | string[] | null,
}

declare interface GameData {
    appid: number,
    gamename?: string,
    exepath?: string,
    pid: number,
    pollrate?: number
}

declare interface Achievement {
    unlocked: boolean,
    apiname: string,
    name: string,
    desc: string,
    percent: number,
    hidden: boolean
}

declare interface Notify extends Achievement {
    id: number,
    type: "main" | "rare" | "plat",
    customisation: Customisation,
    icon: string,
    gamename: string | null
}

declare interface Dialog {
    type: "default" | "selection" | "menu",
    title: string,
    sub?: string | string[],
    addHTML?: string,
    icon?: string,
    buttons?: Button[]
}

declare interface Button {
    id: string | number,
    label: string,
    icon: string,
    customisation?: Customisation,
    click?: Function,
    enabled?: boolean
}

declare interface WinType {
    type: "BrowserWindow" | "Notification",
    notify: Notify,
    options: Electron.BrowserWindowConstructorOptions | Electron.NotificationConstructorOptions
}

declare interface Info {
    info: BuildNotifyInfo,
    customisation: Customisation,
    iswebview: "customiser" | "sspreview" | "ss" | null,
    // iswebview: "customiser" | "sspreview" | null,
    steampath: string | null,
    skipaudio?: boolean
}

declare interface BuildNotifyInfo {
    id: number,
    type: "main" | "rare" | "plat",
    gamename: string | null,
    appid: number,
    apiname: string,
    unlockmsg: string,
    title: string,
    desc: string,
    icon: string,
    percent: {
        value: number,
        rarity: number,
        showpercent: "rareonly" | "all" | "off"
    },
    hidden: boolean
}

declare interface Positions {
    topleft: { x: number | "start" | "center" | "end", y: number | "start" | "center" | "end" },
    topcenter: { x: number | "start" | "center" | "end", y: number | "start" | "center" | "end" },
    topright: { x: number | "start" | "center" | "end", y: number | "start" | "center" | "end" },
    bottomleft: { x: number | "start" | "center" | "end", y: number | "start" | "center" | "end" },
    bottomcenter: { x: number | "start" | "center" | "end", y: number | "start" | "center" | "end" },
    bottomright: { x: number | "start" | "center" | "end", y: number | "start" | "center" | "end" }
}

declare interface ProcessInfo {
    pid: number,
    exe: string
}

declare interface AppInfo {
    appid: number,
    gamename?: string | null
    pollrate?: number,
    maxretries?: number
}

declare interface AchievementIcon {
    handle: any,
    width: number,
    height: number
}

declare module "simple-vdf"