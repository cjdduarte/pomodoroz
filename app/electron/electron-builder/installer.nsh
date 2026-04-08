!macro customInstall
  !ifndef DO_NOT_CREATE_START_MENU_SHORTCUT
    ${ifNot} ${FileExists} "$newStartMenuLink"
      !ifdef MENU_FILENAME
        CreateDirectory "$SMPROGRAMS\${MENU_FILENAME}"
        ClearErrors
      !endif

      # Defensive fallback: some update/reinstall paths can preserve shortcut
      # state and skip recreation when the link is unexpectedly missing.
      CreateShortCut "$newStartMenuLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
      ClearErrors
      WinShell::SetLnkAUMI "$newStartMenuLink" "${APP_ID}"
    ${endIf}
  !endif
!macroend
