# Converts an HTML file to PDF using "Safari's" "Save to PDF..." Functionality.
# Reads from the command line the path of the HTML document.
#
# Example: 	osascript GeneratePDFs.scpt ~/Sites/delors.github.io/lab-shell/folien.rst.html
#
# Remark: 		Safari's "Export as PDF" generates PDFs which does not honor 
# 				media settings and we don't want that!
#
# Helpful URLs (for the development):
# 				"Keycodes:"    http://macbiblioblog.blogspot.com/2014/12/key-codes-for-function-and-special-keys.html
# 				"Inspired by:" https://www.macscripter.net/t/scripting-a-full-path-from-standard-save-as-dialog-box/75178/4
#
# Version:		1.0
#				Feb. 2024
#				Michael Eichberg
#
# Dependencies:
# 				Safari 17.3
on run argv
	
	if length of argv is less than 1 then
		log "[error] Parameter missing!"
		log "GeneratePDFs <Name of the HTML document to convert.>"
		return -1
	end if
	
	-- split filename into directory and filename parts
	set theFile to item 1 of argv
	set thePOSIXFile to POSIX file theFile as alias
	tell application "Finder" to set filename to name of thePOSIXFile as text
	set thePath to characters 1 thru ((length of theFile) - (length of filename)) of theFile as text
	
	log "Target path: " & thePath
	log "Filename:    " & filename
	
	tell application "Safari" to activate
	tell application "Safari"
		open thePath & filename
	end tell
	tell application "System Events" to tell application process "Safari"
		set frontmost to true
		
		# The following makes sure that LectureDoc uses the printing optimized
		# view.
		keystroke "p"
		delay 0.1
		
		# window 1
		tell window 1
			
			# PRINT - using keystrokes is faster
			keystroke "p" using {command down}
			
			# check for PRINT sheet
			repeat until exists sheet 1
				delay 0.2
			end repeat
			
			# PRINT sheet
			tell sheet 1
				perform action "AXShowMenu" of menu button 1 of group 2 of splitter group 1 -- pdf menu button
				delay 0.2
				# set uiElems to entire contents -- uncomment to facilitate debugging in / development with Script Editor
				perform action "AXPress" of menu item "Save as PDF…" of menu 1 of menu button 1 of group 2 of splitter group 1 -- save as pdf...
				
				
				# check for "Save as PDF" sheet
				repeat until exists sheet 1
					delay 0.2
				end repeat
				
				# "Save as PDF" sheet
				tell sheet 1
					set uiElems to entire contents
					# set the filename of the PDF
					set value of text field 1 to filename & ".pdf"
					delay 0.2
					
					# We have to set the target folder using the "select folder" dialog
					key code 5 using {command down, shift down} # key code 5 is "g"
					delay 1
					
					key code 51 -- press "delete" (to make the script "safer")
					delay 0.1
					
					keystroke thePath
					delay 0.1
					
					key code 36 -- press "return"
					delay 0.5
					
					
					click (every button whose name is "Save")
					
					# if the file esists, replace it
					# check if "Repace Existing" sheet appears
					
					if exists sheet 1 then
						log "Replaced     " & filename & ".pdf"
						tell sheet 1 to click button "Replace"
					else
						log "Saved:       " & filename & ".pdf"
					end if
					
				end tell -- "Save as PDF" sheet
				
			end tell -- # PRINT sheet
			
		end tell -- window 1
		
	end tell -- application "System Events" > application process "Safari"
	
	tell application "Safari"
		close the current tab of window 1
	end tell
end run

