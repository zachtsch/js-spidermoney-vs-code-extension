import * as vscode from 'vscode';
import * as https from 'https';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import { exec, execSync } from 'child_process';
import AdmZip from 'adm-zip';

const SPIDERMONKEY_PATH = 'C:\\spidermonkey';
const SPIDERMONKEY_URL = 'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/jsshell-win64.zip';


async function setupSpiderMonkeyOnWin() {
    // Step 1: Download the ZIP file
    const zipFilePath = path.join(os.tmpdir(), 'spidermonkey.zip');
    await downloadFile(SPIDERMONKEY_URL, zipFilePath);

    // Step 2: Extract the ZIP file
    if (fs.existsSync(SPIDERMONKEY_PATH)) {
        await fs.remove(SPIDERMONKEY_PATH);
    }
    await fs.ensureDir(SPIDERMONKEY_PATH);

    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(SPIDERMONKEY_PATH, true);

    // Step 3: Add to Windows PATH
    addToPath(SPIDERMONKEY_PATH);

    // Clean up downloaded zip file
    await fs.remove(zipFilePath);
}

async function setupSpiderMonkeyOnMac() {
    let terminal = vscode.window.activeTerminal;
    if (!terminal) terminal = vscode.window.createTerminal("Homebrew Installation");
    exec('brew -v', (error, stdout, stderr) => {
        // console.log('error',error,'stdout',stdout,'stderr',stderr)
        if (error) {
        //   vscode.window.showWarningMessage('Homebrew is not installed. Installing now...');
  
          // Show terminal and run Homebrew installation script
          terminal.show(true); // Show the terminal window
  
          // Run the installation script inside the terminal
          terminal.sendText('clear;/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)";eval "$(/opt/homebrew/bin/brew shellenv)";brew install spidermonkey');
  
        //   exec('js -v', (e,s,t)=>{
            // console.log('e',e,'s',s,'t',t);
        //   });
        //   vscode.window.showInformationMessage('Homebrew installation started. Check the terminal for progress.');
  
        } else {
          vscode.window.showInformationMessage('Homebrew is already installed! Attempting to install spidermonkey');
          terminal.sendText('brew install spidermonkey');
        }
      });
}





function downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to download file: ${response.statusCode}`));
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close(resolve as any);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

function addToPath(dir: string) {
    const powershellCommand = `
    [System.Environment]::GetEnvironmentVariable('Path', 'User') -split ';' | ForEach-Object { 
        if ($_ -eq '${SPIDERMONKEY_PATH}') { $found = $true }
    }
    if (-not $found) {
        [System.Environment]::SetEnvironmentVariable('Path', [System.Environment]::GetEnvironmentVariable('Path', 'User') + ';${SPIDERMONKEY_PATH}', 'User')
    }`;

    exec(`powershell -Command "${powershellCommand}"`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    });
}



export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('javascript--spidermonkey--run-button.run', () => {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document;
            const filePath = document.fileName;

            // Get the current terminal or create a new one if none exists
            let terminal = vscode.window.activeTerminal;
            if (!terminal) {
                terminal = vscode.window.createTerminal(`Run: ${filePath}`);
                terminal.show();
                //setTimeout(() => {
                terminal!.sendText(`clear\r\njs "${filePath}"`);  // Assuming 'js' is the command for running SpiderMonkey
                //}, 500);  // Delay in milliseconds (adjust if needed)
            }else{
                terminal.show();
                terminal.sendText(`js "${filePath}"`);  // For example, if you are running *.js files
            }
        }
    });


    // Focus on the terminal and run the file
    let dlAndPath = vscode.commands.registerCommand('javascript--spidermonkey--run-button.install', async () => {
        if (os.platform() !== 'win32' && os.platform() !== 'darwin') {
            vscode.window.showErrorMessage('This setup is only for Windows and Mac.');
            return;
        }

        try {
            if(os.platform() === 'win32') await winInstall();
            else if(os.platform() === 'darwin') await macInstall();
            // vscode.window.showInformationMessage('SpiderMonkey successfully installed and added to PATH!');
        } catch (error : unknown) {
            if(error instanceof Error){
                vscode.window.showErrorMessage(`Error setting up SpiderMonkey: ${error.message}`);
            }else{
                vscode.window.showErrorMessage(`Unknown error occured: ${error}`);

            }
        }
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(dlAndPath);
        
}


async function winInstall(){
    try {
        await setupSpiderMonkeyOnWin();
        vscode.window.showInformationMessage('SpiderMonkey successfully installed and added to PATH!');
    } catch (error : unknown) {
        if(error instanceof Error){
            vscode.window.showErrorMessage(`Error setting up SpiderMonkey: ${error.message}`);
        }else{
            vscode.window.showErrorMessage(`Unknown error occured: ${error}`);

        }
    }
}

async function macInstall(){
    try {
        await setupSpiderMonkeyOnMac();
        // vscode.window.showInformationMessage('SpiderMonkey successfully installed and added to PATH!');
    } catch (error : unknown) {
        if(error instanceof Error){
            vscode.window.showErrorMessage(`Error setting up SpiderMonkey: ${error.message}`);
        }else{
            vscode.window.showErrorMessage(`Unknown error occured: ${error}`);

        }
    }
}

    
    // context.subscriptions.push(dlAndPath);



export function deactivate() {}
