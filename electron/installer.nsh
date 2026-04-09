!macro customFinishPage
  Function StartApp
    ${if} ${isUpdated}
      StrCpy $1 "--updated"
    ${else}
      StrCpy $1 ""
    ${endif}
    ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
  FunctionEnd

  Function CreateDesktopShortcut
    SetShellVarContext current
    CreateShortCut "$DESKTOP\${SHORTCUT_NAME}.lnk" "$appExe" "" "$INSTDIR\resources\app\electron\assets\nexora.ico" 0
  FunctionEnd

  !define MUI_FINISHPAGE_TITLE "Installazione completata"
  !define MUI_FINISHPAGE_TEXT "NEXORA è stato installato correttamente.$\r$\n$\r$\nProgettato e sviluppato da Gaetano Meli."
  !define MUI_FINISHPAGE_RUN
  !define MUI_FINISHPAGE_RUN_TEXT "Avvia Nexora"
  !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !define MUI_FINISHPAGE_SHOWREADME
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Aggiungi icona al desktop"
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION "CreateDesktopShortcut"
  !insertmacro MUI_PAGE_FINISH
!macroend

!macro customInstall
  SetShellVarContext current
  Delete "$DESKTOP\Softshop v4.lnk"
  Delete "$SMPROGRAMS\Softshop v4\Softshop v4.lnk"
  RMDir /r "$SMPROGRAMS\Softshop v4"
  RMDir /r "$LOCALAPPDATA\Programs\Softshop v4"
  CreateDirectory "$SMPROGRAMS\${SHORTCUT_NAME}"
  Delete "$SMPROGRAMS\${SHORTCUT_NAME}\${SHORTCUT_NAME}.lnk"
  CreateShortCut "$SMPROGRAMS\${SHORTCUT_NAME}\${SHORTCUT_NAME}.lnk" "$appExe" "" "$INSTDIR\resources\app\electron\assets\nexora.ico" 0
!macroend

!macro customUnInstall
  SetShellVarContext current
  Delete "$DESKTOP\Softshop v4.lnk"
  Delete "$DESKTOP\${SHORTCUT_NAME}.lnk"
  Delete "$SMPROGRAMS\Softshop v4\Softshop v4.lnk"
  Delete "$SMPROGRAMS\${SHORTCUT_NAME}\${SHORTCUT_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\Softshop v4"
  RMDir /r "$SMPROGRAMS\${SHORTCUT_NAME}"
!macroend
