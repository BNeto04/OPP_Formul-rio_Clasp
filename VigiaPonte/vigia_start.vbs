' Vigia da Ponte - Windows Autostart Script
Option Explicit
Dim sh, fso, nodeExe, launcherJs

Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

launcherJs = "C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\VigiaPonte\vigia_launcher.js"

If Not fso.FileExists(launcherJs) Then
  WScript.Quit 0
End If

sh.CurrentDirectory = "C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\VigiaPonte"
sh.Run "node.exe """ & launcherJs & """", 0, False
