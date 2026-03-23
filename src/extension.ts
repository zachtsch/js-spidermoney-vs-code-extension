import * as vscode from 'vscode';
import * as https from 'https';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { exec, execFile } from 'child_process';
import AdmZip from 'adm-zip';

const SPIDERMONKEY_PATH = 'C:\\spidermonkey';
const SPIDERMONKEY_URL = 'https://download-origin.cdn.mozilla.net/pub/firefox/releases/128.14.0esr/jsshell/jsshell-win64.zip';
// const SPIDERMONKEY_URL = 'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/jsshell-win64.zip';


async function setupSpiderMonkeyOnWin(): Promise<boolean> {
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
    const pathWasUpdated = await addToPath(SPIDERMONKEY_PATH);

    // Clean up downloaded zip file
    await fs.remove(zipFilePath);

    return pathWasUpdated;
}

async function setupSpiderMonkeyOnMac() {
    let terminal = vscode.window.activeTerminal;
    if (!terminal) {
        terminal = vscode.window.createTerminal('Homebrew Installation');
    }

    
    // const installSuccessMessage = "printf '\\nSpiderMonkey installed successfully. You can now run `js` from this terminal.\\n'";
    const installSuccessMessage = "printf '\\nSpiderMonkey installed successfully. You can now run `js` from this terminal. If it is not recognized, try restarting your terminal or VS Code.\\n'";
    const installWithHomebrewSetupCommand = 'clear;/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && eval "$(/opt/homebrew/bin/brew shellenv)" && brew install spidermonkey && ' + installSuccessMessage;
    const installWithExistingHomebrewCommand = 'brew install spidermonkey && ' + installSuccessMessage;

    exec('brew -v', (error, stdout, stderr) => {
        // console.log('error',error,'stdout',stdout,'stderr',stderr)
        if (error) {
        //   vscode.window.showWarningMessage('Homebrew is not installed. Installing now...');
  
          // Show terminal and run Homebrew installation script
          terminal.show(true); // Show the terminal window
  
          // Run the installation script inside the terminal
          terminal.sendText(installWithHomebrewSetupCommand);
  
        //   exec('js -v', (e,s,t)=>{
            // console.log('e',e,'s',s,'t',t);
        //   });
        //   vscode.window.showInformationMessage('Homebrew installation started. Check the terminal for progress.');
  
        } else {
          terminal.show(true);
          vscode.window.showInformationMessage('Homebrew is already installed! Attempting to install spidermonkey');
          terminal.sendText(installWithExistingHomebrewCommand);
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

function normalizeWindowsPath(dir: string): string {
    return path.win32.normalize(dir).replace(/[\\\/]+$/, '').toLowerCase();
}

function addToCurrentProcessPath(dir: string) {
    const currentPath = process.env.PATH ?? '';
    const entries = currentPath.split(path.delimiter).filter((entry) => entry.trim().length > 0);
    const normalizedDir = normalizeWindowsPath(dir);
    const hasEntry = entries.some((entry) => normalizeWindowsPath(entry) === normalizedDir);

    if (!hasEntry) {
        process.env.PATH = [dir, ...entries].join(path.delimiter);
    }
}

function escapePowerShellSingleQuotedString(value: string): string {
    return value.replace(/'/g, "''");
}

function execFileAsync(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        execFile(command, args, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr.trim() || error.message));
                return;
            }

            resolve({ stdout, stderr });
        });
    });
}

async function addToPath(dir: string): Promise<boolean> {
    if (os.platform() !== 'win32') {
        addToCurrentProcessPath(dir);
        return false;
    }

    addToCurrentProcessPath(dir);

    const escapedDir = escapePowerShellSingleQuotedString(dir);
    const script = `
$ErrorActionPreference = 'Stop'
$targetDir = '${escapedDir}'
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($null -eq $userPath) {
    $userPath = ''
}

$entries = @()
if ($userPath.Length -gt 0) {
    $entries = $userPath -split ';' | Where-Object { $_.Trim().Length -gt 0 }
}

$seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$updatedEntries = [System.Collections.Generic.List[string]]::new()

foreach ($entry in @($targetDir) + $entries) {
    $trimmedEntry = $entry.Trim()
    if ($trimmedEntry.Length -eq 0) {
        continue
    }

    $normalizedEntry = $trimmedEntry.TrimEnd('\\')
    if ($seen.Add($normalizedEntry)) {
        [void]$updatedEntries.Add($trimmedEntry)
    }
}

$newUserPath = [string]::Join(';', $updatedEntries)
$pathChanged = $newUserPath -ne $userPath

if ($pathChanged) {
    [Environment]::SetEnvironmentVariable('Path', $newUserPath, 'User')
    Write-Output 'updated'
} else {
    Write-Output 'unchanged'
}
`;

    const { stdout, stderr } = await execFileAsync('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        script
    ]);

    if (stderr.trim().length > 0) {
        throw new Error(stderr.trim());
    }

    const result = stdout.trim();
    if (result !== 'updated' && result !== 'unchanged') {
        throw new Error(`Unexpected response while updating PATH: ${result}`);
    }

    return result === 'updated';
}




export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('javascript--spidermonkey--run-button.run', async () => {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;

        if (editor) {   
            const document = editor.document;
            const filePath = document.fileName;

            if (document.isUntitled) {
                vscode.window.showInformationMessage("Save the file as .js to enable Run");
                return;
            }
            await vscode.window.activeTextEditor?.document.save();

            // Get the current terminal or create a new one if none exists
            let terminal = vscode.window.activeTerminal;
            if (!terminal) {
                terminal = vscode.window.createTerminal(`Run: ${filePath}`);
                terminal.show();
                //setTimeout(() => {
                // terminal!.sendText(`js "${filePath}"`);  // Assuming 'js' is the command for running SpiderMonkey
                terminal!.sendText(`clear\r\njs "${filePath}"`);  // Assuming 'js' is the command for running SpiderMonkey
                //}, 500);  // Delay in milliseconds (adjust if needed)
            }else{
                terminal.show();
                terminal.sendText(`js "${filePath}"`);  // For example, if you are running *.js files
            }
        }
    });

    let disposable2 = vscode.commands.registerCommand('javascript--spidermonkey--run-button.tsnode', async () => {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document;
            const filePath = document.fileName;

            if (document.isUntitled) {
                vscode.window.showInformationMessage("Save the file as .ts to enable Run");
                return;
            }
            await vscode.window.activeTextEditor?.document.save();

            // Get the current terminal or create a new one if none exists
            let terminal = vscode.window.activeTerminal;
            if (!terminal) {
                terminal = vscode.window.createTerminal(`Run: ${filePath}`);
                terminal.show();
                //setTimeout(() => {
                terminal!.sendText(`clear\r\nts-node "${filePath}"`);  // Assuming 'js' is the command for running SpiderMonkey
                // terminal!.sendText(`ts-node "${filePath}"`);  // Assuming 'js' is the command for running SpiderMonkey
                //}, 500);  // Delay in milliseconds (adjust if needed)
            }else{
                terminal.show();;
                terminal.sendText(`ts-node "${filePath}"`);  // For example, if you are running *.js files
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
            if (os.platform() === 'win32') {
                await winInstall();
            } else if (os.platform() === 'darwin') {
                await macInstall();
            }
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
    context.subscriptions.push(disposable2);
    context.subscriptions.push(dlAndPath);
        
}


async function winInstall(){
    try {
        const pathWasUpdated = await setupSpiderMonkeyOnWin();
        if (pathWasUpdated) {
            vscode.window.showInformationMessage('SpiderMonkey installed. Your Windows user PATH was updated for future terminals; you may need to restart VS Code or open a new terminal before using `js` manually.');
        } else {
            vscode.window.showInformationMessage('SpiderMonkey installed. `C:\\spidermonkey` was already present in your Windows user PATH.');
        }
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
