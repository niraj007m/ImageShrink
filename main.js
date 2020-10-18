const path = require('path')
const os = require('os')
const { app, BrowserWindow, Menu, globalShortcut, ipcMain, shell } = require('electron')
const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const slash = require('slash')
//const { createDiffieHellman } = require('crypto')
const log = require('electron-log')


//Set env
process.env.NODE_ENV = 'production'
const isDev = process.env.NODE_ENV !== 'production' ? true : false
const isMac = process.platform === 'darwin' ? true : false

let mainWindow
let aboutWindow
function createMainWindow () {
    mainWindow = new BrowserWindow({
        title: 'ImageShrink',
        width: isDev ? 800 : 500, 
        height: 600,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        webPreferences: { 
            //worldSafeExecuteJavaScript: true,
            //contextIsolation: true,
            nodeIntegration: true,
        },
        resizable: isDev,
        backgroundColor: 'white',
    })

    if (isDev){
        mainWindow.webContents.openDevTools()
    }
    // mainWindow.loadURL(`file://${__dirname}/app/index.html`)
    mainWindow.loadFile('./app/index.html')
}

function createAboutWindow () {
    aboutWindow = new BrowserWindow({
        title: 'About ImageShrink',
        width: 300, 
        height: 300,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        resizable: false,
        backgroundColor: 'white',
    })
    /*mainWindow.loadURL(`file://${__dirname}/app/index.html`)*/
    aboutWindow.loadFile('./app/about.html')
}

app.on('ready', () => {
    createMainWindow()
    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)

    
    globalShortcut.register('CmdOrCtrl+R', () => mainWindow.reload())
    globalShortcut.register(isMac ? 'Command+Alt+I' : 'Ctrl+Shift+I', () => mainWindow.toggleDevTools())
    

    mainWindow.on('closed', () => (mainWindow = null))
})

const menu = [
    ...(isMac ? [
        {
            label: app.name,
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow,
                }
            ]
        }
    ] : []),
    {
      role: 'fileMenu',  
    },
    ...(!isMac ? [
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow,
                },
            ]
        }
    ] : []),
    ...(isDev ? [
        {
            label: 'Developer',
            submenu: [
                { role: 'reload'},
                { role: 'forcereload'},
                { type: 'separator'},
                { role: 'toggledevtools'},
            ]
        }
    ] : [])
]

ipcMain.on('image:minimize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageshrink')
    shrinkImage(options)
})

async function shrinkImage({ imgPath, quality, dest}) {
try {
    const pngQuality = quality / 100
    const files = await imagemin([slash(imgPath)], {
        destination: dest,
        plugins: [
            imageminMozjpeg({ quality }),
            imageminPngquant({
                quality: [pngQuality, pngQuality]
            })
        ]
    })
    //console.log(files)
    log.info(files)
    shell.openPath(dest)
    mainWindow.webContents.send('image:done')
} catch (err) {
    //console.log(err)
    log.error(err)
}
}

// close functionality 
app.on('window-all-closed', () => {
    if (!isMac) {
      app.quit()
    }
  })
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })