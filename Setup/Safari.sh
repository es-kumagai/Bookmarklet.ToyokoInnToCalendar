#!/bin/sh

BOOKMARK_PLIST="${HOME}/Library/Safari/Bookmarks.plist"
BOOKMARKLET_TITLE="東横INN の予約をカレンダーに登録"
BOOKMARKLET_URL="javascript:%28function%28%29%20%7B%0A%09const%20e%20%3D%20document.createElement%28%27script%27%29%3B%0A%09const%20url%20%3D%20%27%%BOOKMARKLET_SCRIPT_URL%%%27%3B%0A%09e.charset%3D%27utf-8%27%3B%0A%09e.src%3Durl%3B%0A%09document.body.appendChild%28e%29%3B%0A%7D%29%28%29"
FOLDER_TITLE="Bookmarklet"
BOOKMARKLET_SCRIPT_URL="https://rawgit.com/es-kumagai/Bookmarklet.ToyokoInnToCalendar/%%BRANCH%%/ToyokoInnToCalendar.js"

DATE=$(date +%Y%m%d-%H%M%S)
FOLDER_UUID=$(uuidgen)
BOOKMARKLET_UUID=$(uuidgen)
BOOKMARK_PLIST_BACKUP="/tmp/Safari.Bookmarks.backup-${DATE}.plist"

echo "Backup Safari's bookmark file to '${BOOKMARK_PLIST_BACKUP}' ..."
cp -vf "${BOOKMARK_PLIST}" "${BOOKMARK_PLIST_BACKUP}"

DATA=$(cat << END_OF_ITEM
{
	"WebBookmarkUUID" : "%FOLDER_UUID%",
	"WebBookmarkType" : "WebBookmarkTypeList",
	"Title" : "%FOLDER_TITLE%",
	"Children" : [
		{
			"WebBookmarkUUID" : "%BOOKMARKLET_UUID%",
			"WebBookmarkType" : "WebBookmarkTypeLeaf",
			"URIDictionary" : {
				"title" : "%BOOKMARKLET_TITLE%"
			},
			"URLString" : "%BOOKMARKLET_URL%",
			"ReadingListNonSync" : {
				"neverFetchMetadata" : false
			}
		}
	]
}
END_OF_ITEM
)


# Applying branch to bookmarklet url.

if [ "$1" == "dropbox" ]
then

	BRANCH=""
	TITLE_SUFFIX=" (dropbox)"
	URL_PREFIX=""

	BOOKMARKLET_SCRIPT_URL=$(echo "$2" | sed -e "s#://www\.#://dl.#" | sed -e "s/\?dl=0\$//")
	
elif [ "$1" != "" ]
then

	BRANCH="$1"
	TITLE_SUFFIX=" (${BRANCH})"
	URL_PREFIX=""

else

	BRANCH="master"
	TITLE_SUFFIX=""
	URL_PREFIX="cdn."

fi

BOOKMARKLET_SCRIPT_URL=$(echo "${BOOKMARKLET_SCRIPT_URL}" | sed -e "s#/#\\\\/#g")
BOOKMARKLET_URL=$(echo "${BOOKMARKLET_URL}" | sed -e "s/%%BOOKMARKLET_SCRIPT_URL%%/${BOOKMARKLET_SCRIPT_URL}/")
BOOKMARKLET_URL=$(echo "${BOOKMARKLET_URL}" | sed -e "s#://#%3A//${URL_PREFIX}#")
BOOKMARKLET_URL=$(echo "${BOOKMARKLET_URL}" | sed -e "s/%%BRANCH%%/${BRANCH}/")

# Replace '/' with '//'.

FOLDER_TITLE=$(echo "${FOLDER_TITLE}" | sed -e "s#/#\\\\/#g")
BOOKMARKLET_TITLE=$(echo "${BOOKMARKLET_TITLE}" | sed -e "s#/#\\\\/#g")
BOOKMARKLET_URL=$(echo "${BOOKMARKLET_URL}" | sed -e "s#/#\\\\/#g")


# Replace %VALUE% with the actual value.

DATA=$(echo "${DATA}" | sed -e "s/%FOLDER_UUID%/${FOLDER_UUID}/")
DATA=$(echo "${DATA}" | sed -e "s/%FOLDER_TITLE%/${FOLDER_TITLE}/")
DATA=$(echo "${DATA}" | sed -e "s/%BOOKMARKLET_UUID%/${BOOKMARKLET_UUID}/")
DATA=$(echo "${DATA}" | sed -e "s/%BOOKMARKLET_TITLE%/${BOOKMARKLET_TITLE}${TITLE_SUFFIX}/")
DATA=$(echo "${DATA}" | sed -e "s/%BOOKMARKLET_URL%/${BOOKMARKLET_URL}/")


# Create a bookmark for evaluate the bookmarklet.

echo "Creating 'Bookmarklet' to Safari's Bookmark."
plutil -insert "Children.0" -json "${DATA}" "${BOOKMARK_PLIST}"
