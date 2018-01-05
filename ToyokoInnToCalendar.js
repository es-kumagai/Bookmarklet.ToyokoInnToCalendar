(function() {

	class HotelInformation {

		constructor(name, hotelNumber, location, telephoneNumber, url) {
			
			this._name = name;
			this._hotelNumber = hotelNumber;
			this._location = location;
			this._telephoneNumber = telephoneNumber;
			this._url = url;
		}
		
		get name() {
			
			return this._name;
		}
		
		get hotelNumber() {
			
			return this._hotelNumber;
		}
		
		get location() {
			
			return this._location;
		}

		get telephoneNumber() {
			
			return this._telephoneNumber;
		}
		
		get url() {
			
			return this._url;
		}
	}
	
	class AccommodationDescription {
		
		constructor(name, date, period, description) {
			
			this._name = name;
			this._date = date;
			this._period = period;
			this._description = description;
		}
		
		get name() {
			
			return this._name;
		}
		
		get date() {
			
			return this._date;
		}
		
		get period() {
			
			return this._period;
		}
		
		get description() {
			
			return this._description;
		}		
	}
	
	function getInnerTextByFirstElementOfTagName(node, name) {
		
		const targetNode = node.getElementsByTagName(name)[0];
		const innerText = targetNode.innerText;
		
		return innerText;
	}
	
	function getDescriptionTableNode(mainNode) {
		
		const tableNodes = mainNode.getElementsByTagName('table');
		const descriptionTableNode = tableNodes[0];
		
		return descriptionTableNode;
	}

	function getHotelInformationFromHotelNameOrNullAsynclonously(name, callback) {
		
		const request = new XMLHttpRequest();
		const synchronous = true;
		
		request.open('GET', '/hotel_list', synchronous);
		request.responseType = 'document';
		request.onload = function() {
			
			if (this.status !== 200) {
	
				// 所在地を取得できない場合は null を返します。
				callback(name, null);				
			}

			const xml = this.responseXML;
			
			function getHotelColumnNodesOnNode(node) {
				
				return groupSectionNodes = node.getElementsByClassName('htl_col_layout');
			}
			
			function getTargetHotelColumnNodeByHotelColumnNodes(hotelColumnNodes, name) {
				
// 				for (let i = 228; i != 232; ++i) {
				for (let i = 0; i != hotelColumnNodes.length; ++i) {
					
					const hotelColumnNode = hotelColumnNodes[i];
					const hotelNameNode = hotelColumnNode.getElementsByTagName('a')[0];
					const hotelName = hotelNameNode.innerText;

					if (hotelName == name) {
						
						return hotelColumnNode;
					}
				}
					
				return null;
			}
	
			let resultInformation = null;
			
			const mainNode = xml.getElementById('mainArea');
			const hotelColumnNodes = getHotelColumnNodesOnNode(mainNode);
			const hotelColumnNode = getTargetHotelColumnNodeByHotelColumnNodes(hotelColumnNodes, name);
			
			if (hotelColumnNode) {

				const divNodes = hotelColumnNode.getElementsByTagName('div');
				const anchorNode = hotelColumnNode.getElementsByTagName('a')[0];
				
				const number = divNodes[0].innerText;
				const location = divNodes[2].innerText;
				const telephoneNumber = divNodes[3].innerText;
				const url = anchorNode.href;
				
				resultInformation = new HotelInformation(name, number, location, telephoneNumber, url);
			}

			callback(name, resultInformation);
		};
		
		request.send(null);	
	}

	function makeAccommodationDescription(mainNode) {
		
		const descriptionTableNode = getDescriptionTableNode(mainNode);
		const columnNodes = descriptionTableNode.getElementsByTagName('tr');
		
		let accommodationName = null;
		let accommodationDate = null;
		let accommodationPeriod = null;

		function validation() {

			if (!accommodationName == true) {

				throw new Error('ページ内で予約情報 "宿泊ホテル名" を見つけられませんでした。');
			}

			if (!accommodationDate) {

				throw new Error('ページ内で予約情報 "宿泊日" を見つけられませんでした。');
			}

			if (!accommodationPeriod) {

				throw new Error('ページ内で予約情報 "宿泊日数" を見つけられませんでした。');
			}			
		}
		
		function getAccommodationDateAndPeriodFromNode(node) {
			
			let result = new Object();
			const spanNodes = node.getElementsByTagName('span');
			
			result['date'] = spanNodes[0].innerText;
			result['period'] = spanNodes[1].innerText;
			
			return result;
		}
		
		function getAccommodationDescriptionTextFromNode(node) {
			
			let texts = new Array();
			const tableBodyNodes = node.getElementsByTagName('tbody');
			
			for (let i = 0; i != tableBodyNodes.length; ++i) {
				
				texts[texts.length] = tableBodyNodes[i].innerText;
			}
			
			return texts.join("\n");
		}
				
		for (let i = 0; i != columnNodes.length; ++i) {
			
			const columnNode = columnNodes[i];
			const columnHeaderTitle = getInnerTextByFirstElementOfTagName(columnNode, 'th');
			
			switch (columnHeaderTitle) {
				
				case 'ご宿泊ホテル':
					accommodationName = getInnerTextByFirstElementOfTagName(columnNode, 'td');
					break;
				
				case 'ご宿泊日/泊数':
					const dateAndPeriod = getAccommodationDateAndPeriodFromNode(columnNode);
					accommodationDate = dateAndPeriod['date'];
					accommodationPeriod = dateAndPeriod['period'];
					break;
				
				case 'ご宿泊日':
					accommodationDate = getInnerTextByFirstElementOfTagName(columnNode, 'td');
					break;
				
				case '泊数':
					accommodationPeriod = getInnerTextByFirstElementOfTagName(columnNode, 'td');
					break;
				
				case 'ご予約者名':
					break;
					
				default:
					break;
			}
		}

		validation();
				
		const descriptionText = getAccommodationDescriptionTextFromNode(mainNode);

		return new AccommodationDescription(accommodationName, accommodationDate, accommodationPeriod, descriptionText);
	}
	
	function makeCalendarFileData(accommodationDescription, hotelInformation) {
		
		function getCalendarStartDate(accommodationDescription) {
			
			const dateText = accommodationDescription.date;
			const dateComponents = dateText.replace(/[^0-9]/g, ' ').split(' ');
			
			return new Date(dateComponents[0], dateComponents[1] - 1, dateComponents[2]);
		}
		
		function getCalendarEndDate(accommodationDescription) {
			
			const period = Number(accommodationDescription.period.replace(/[^0-9]/g, ''));
			const startDate = getCalendarStartDate(accommodationDescription);

			return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + period);
		}
		
		function getCalendarDateOnlyAsString(date) {

			const yearText = String(date.getFullYear());
			const monthText = ('0' + String(date.getMonth() + 1)).slice(-2);
			const dayText = ('0' + String(date.getDate())).slice(-2);

			return yearText + monthText + dayText;
		}
		
		function getCalendarDateTimeAsString(date) {

			const yearText = String(date.getFullYear());
			const monthText = ('0' + String(date.getMonth() + 1)).slice(-2);
			const dayText = ('0' + String(date.getDate())).slice(-2);
			const hoursText = ('0' + String(date.getHours())).slice(-2);
			const minutesText = ('0' + String(date.getMinutes())).slice(-2);
			const secondsText = ('0' + String(date.getSeconds())).slice(-2);

			return yearText + monthText + dayText + 'T' + hoursText + minutesText + secondsText;
		}
		
		function convertToContentTextFrom(text) {
			
			return text.replace(/\n/g, '\\n');
		}

		const currentDate = new Date();
		const calendarData = [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'PRODID:-//ez-net.jp//ToyokoInnToCalendar',
			'CALSCALE:GREGORIAN',
			'METHOD:PUBLISH',
			'X-WR-CALNAME:' + convertToContentTextFrom(accommodationDescription.name),
			'X-WR-TIMEZONE:JST',
			'BEGIN:VEVENT',
			'SUMMARY:' + convertToContentTextFrom(accommodationDescription.name + ' 宿泊'),
			'DTSTART;TZID=JST;VALUE=DATE:' + getCalendarDateOnlyAsString(getCalendarStartDate(accommodationDescription)),
			'DTEND;TZID=JST;VALUE=DATE:' + getCalendarDateOnlyAsString(getCalendarEndDate(accommodationDescription)),
			'DTSTAMP;VALUE=DATE-TIME:' + getCalendarDateTimeAsString(currentDate),
			'CREATED;VALUE=DATE-TIME:' + getCalendarDateTimeAsString(currentDate),
			'DESCRIPTION:' + convertToContentTextFrom(accommodationDescription.description),
			'LOCATION:' + convertToContentTextFrom(hotelInformation ? hotelInformation.location : accommodationDescription.name),
			'URL:' + document.location,
			'END:VEVENT',
			'END:VCALENDAR'
			];

		return calendarData.join('\n');
	}

	try {

		const mainNode = document.getElementById('mainArea');

		if (!mainNode) {
			
			throw new Error('東横INN のご予約内容詳細画面ではないかもしれません。') 
		}
	
		const accommodationDescription = makeAccommodationDescription(mainNode);
		
		getHotelInformationFromHotelNameOrNullAsynclonously(accommodationDescription.name, function(name, hotelInformation) {
			const calendarData = makeCalendarFileData(accommodationDescription, hotelInformation);
			const calendarFileURI = 'data:text/calendar;charset=utf8,' + encodeURI(calendarData);
	
			window.open(calendarFileURI, 'test');
		});
	}
	catch (error) {
		
		alert('予約情報の取得に失敗しました。' + error.message + ' (line: ' + error.line + ')');
	}
})()
