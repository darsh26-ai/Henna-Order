/* =========================================
   HENNA BOOKING BACKEND
   GOOGLE APPS SCRIPT
========================================= */


/* =========================================
   CONFIGURATION
========================================= */

/*
   Replace these values with your actual IDs.
*/


const CONFIG = {

    /*
       Create or use a Google Sheet
       for storing bookings.

       Sheet ID is the part between:

       https://docs.google.com/spreadsheets/d/

       and

       /edit
    */

    SPREADSHEET_ID:
        "PASTE_YOUR_GOOGLE_SHEET_ID_HERE",


    SHEET_NAME:
        "Bookings",


    /*
       Google Calendar IDs.

       Recommended:

       Create one calendar for Nirali
       and another calendar for Kaushika.

       Then copy each calendar ID.
    */

    CALENDARS: {

        Nirali:
            "PASTE_NIRALI_CALENDAR_ID_HERE",

        Kaushika:
            "PASTE_KAUSHIKA_CALENDAR_ID_HERE"
    },


    /*
       Time zone for bookings.

       Since you are in Maryland,
       America/New_York is appropriate.

       Change if needed.
    */

    TIMEZONE:
        "America/New_York"
};


/* =========================================
   GET REQUEST
========================================= */

function doGet() {

    return createJsonResponse({
        success: true,
        message: "Henna Booking API is running."
    });
}


/* =========================================
   POST REQUEST
========================================= */

function doPost(e) {

    try {

        const data =
            JSON.parse(e.postData.contents);


        validateAction(data);


        if (
            data.action ===
            "checkAvailability"
        ) {

            return handleCheckAvailability(
                data
            );
        }


        if (
            data.action ===
            "createBooking"
        ) {

            return handleCreateBooking(
                data
            );
        }


        return createJsonResponse({
            success: false,
            message: "Invalid action."
        });


    } catch (error) {

        console.error(error);


        return createJsonResponse({
            success: false,
            message: error.message ||
                "Server error occurred."
        });
    }
}


/* =========================================
   VALIDATE ACTION
========================================= */

function validateAction(data) {

    if (!data) {

        throw new Error(
            "No booking data received."
        );
    }


    if (!data.action) {

        throw new Error(
            "Action is required."
        );
    }


    if (!data.artist) {

        throw new Error(
            "Henna artist is required."
        );
    }


    if (!CONFIG.CALENDARS[data.artist]) {

        throw new Error(
            "Invalid Henna artist."
        );
    }


    if (!data.bookingDate) {

        throw new Error(
            "Booking date is required."
        );
    }


    if (!data.startTime) {

        throw new Error(
            "Start time is required."
        );
    }


    if (!data.duration ||
        Number(data.duration) <= 0) {

        throw new Error(
            "Valid duration is required."
        );
    }
}


/* =========================================
   CHECK AVAILABILITY REQUEST
========================================= */

function handleCheckAvailability(data) {

    const availability =
        checkAvailability(data);


    return createJsonResponse({
        success: true,
        available:
            availability.available,
        message:
            availability.message
    });
}


/* =========================================
   CREATE BOOKING REQUEST
========================================= */

function handleCreateBooking(data) {

    validateBookingData(data);


    /*
       Lock prevents simultaneous requests
       from creating overlapping bookings.
    */

    const lock =
        LockService.getScriptLock();


    try {

        /*
           Wait up to 30 seconds
           for another booking process.
        */

        lock.waitLock(30000);


        /*
           Check AGAIN after obtaining lock.

           This is very important for preventing
           double bookings.
        */

        const availability =
            checkAvailability(data);


        if (!availability.available) {

            return createJsonResponse({
                success: false,
                available: false,
                message:
                    availability.message
            });
        }


        /*
           Create calendar event.
        */

        const event =
            createCalendarEvent(data);


        /*
           Generate booking ID.
        */

        const bookingId =
            generateBookingId();


        /*
           Save booking into Google Sheet.
        */

        saveBookingToSheet(
            data,
            bookingId,
            event.getId()
        );


        return createJsonResponse({

            success: true,

            available: true,

            bookingId:
                bookingId,

            calendarEventId:
                event.getId(),

            message:
                "Booking successfully created."
        });


    } finally {

        /*
           Always release lock.
        */

        try {

            lock.releaseLock();

        } catch (error) {

            console.error(
                "Unable to release lock:",
                error
            );
        }
    }
}


/* =========================================
   CHECK CALENDAR AVAILABILITY
========================================= */

function checkAvailability(data) {

    const calendarId =
        CONFIG.CALENDARS[data.artist];


    const calendar =
        CalendarApp.getCalendarById(
            calendarId
        );


    if (!calendar) {

        throw new Error(
            "Calendar not found for " +
            data.artist
        );
    }


    const start =
        createStartDateTime(data);


    const end =
        createEndDateTime(
            data,
            start
        );


    if (start.getTime() < new Date().getTime()) {

        return {
            available: false,
            message:
                "Please select a future date and time."
        };
    }


    /*
       Gets all events overlapping
       the selected time range.
    */

    const events =
        calendar.getEvents(
            start,
            end
        );


    if (events.length > 0) {

        const conflictingEvent =
            events[0];


        return {

            available: false,

            message:
                "Sorry, " +
                data.artist +
                " is already booked during this time. " +
                "Please select another time."
        };
    }


    return {

        available: true,

        message:
            data.artist +
            " is available at this time."
    };
}


/* =========================================
   CREATE CALENDAR EVENT
========================================= */

function createCalendarEvent(data) {

    const calendarId =
        CONFIG.CALENDARS[data.artist];


    const calendar =
        CalendarApp.getCalendarById(
            calendarId
        );


    if (!calendar) {

        throw new Error(
            "Calendar not found for " +
            data.artist
        );
    }


    const start =
        createStartDateTime(data);


    const end =
        createEndDateTime(
            data,
            start
        );


    const title =
        "🌸 Henna Booking - " +
        data.customerName;


    const description =

`BOOKING DETAILS

Customer Name: ${data.customerName}
Phone: ${data.phone}
Email: ${data.email || "N/A"}

Henna Artist: ${data.artist}
Service: ${data.service}

Number of People: ${data.numberOfPeople}

Location:
${data.location}

Notes:
${data.notes || "No additional notes"}


Created through Henna Booking Website.`;


    return calendar.createEvent(
        title,
        start,
        end,
        {
            description:
                description,

            location:
                data.location
        }
    );
}


/* =========================================
   CREATE START DATE TIME
========================================= */

function createStartDateTime(data) {

    const parts =
        data.bookingDate.split("-");


    const timeParts =
        data.startTime.split(":");


    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]) - 1;

    const day =
        Number(parts[2]);

    const hour =
        Number(timeParts[0]);

    const minute =
        Number(timeParts[1]);


    return new Date(
        year,
        month,
        day,
        hour,
        minute,
        0
    );
}


/* =========================================
   CREATE END DATE TIME
========================================= */

function createEndDateTime(
    data,
    start
) {

    const durationHours =
        Number(data.duration);


    const milliseconds =
        durationHours *
        60 *
        60 *
        1000;


    return new Date(
        start.getTime() +
        milliseconds
    );
}


/* =========================================
   VALIDATE FULL BOOKING
========================================= */

function validateBookingData(data) {

    const requiredFields = [

        "customerName",

        "phone",

        "artist",

        "service",

        "bookingDate",

        "startTime",

        "duration",

        "numberOfPeople",

        "location"
    ];


    requiredFields.forEach(
        function(field) {

            if (
                data[field] === undefined ||
                data[field] === null ||
                String(data[field]).trim() === ""
            ) {

                throw new Error(
                    field +
                    " is required."
                );
            }
        }
    );
}


/* =========================================
   SAVE BOOKING TO GOOGLE SHEET
========================================= */

function saveBookingToSheet(
    data,
    bookingId,
    calendarEventId
) {

    const spreadsheet =
        SpreadsheetApp.openById(
            CONFIG.SPREADSHEET_ID
        );


    let sheet =
        spreadsheet.getSheetByName(
            CONFIG.SHEET_NAME
        );


    /*
       Automatically creates the sheet
       if it doesn't exist.
    */

    if (!sheet) {

        sheet =
            spreadsheet.insertSheet(
                CONFIG.SHEET_NAME
            );
    }


    /*
       Create header if sheet is empty.
    */

    if (sheet.getLastRow() === 0) {

        sheet.appendRow([

            "Booking ID",

            "Created At",

            "Customer Name",

            "Phone",

            "Email",

            "Artist",

            "Service",

            "Event Date",

            "Start Time",

            "Duration Hours",

            "Number of People",

            "Location",

            "Notes",

            "Calendar Event ID"
        ]);
    }


    sheet.appendRow([

        bookingId,

        new Date(),

        data.customerName,

        data.phone,

        data.email || "",

        data.artist,

        data.service,

        data.bookingDate,

        data.startTime,

        data.duration,

        data.numberOfPeople,

        data.location,

        data.notes || "",

        calendarEventId
    ]);
}


/* =========================================
   GENERATE BOOKING ID
========================================= */

function generateBookingId() {

    const timestamp =
        Utilities.formatDate(
            new Date(),
            CONFIG.TIMEZONE,
            "yyyyMMdd-HHmmss"
        );


    const random =
        Math.floor(
            1000 +
            Math.random() * 9000
        );


    return (
        "HENNA-" +
        timestamp +
        "-" +
        random
    );
}


/* =========================================
   JSON RESPONSE
========================================= */

function createJsonResponse(data) {

    return ContentService
        .createTextOutput(
            JSON.stringify(data)
        )
        .setMimeType(
            ContentService.MimeType.JSON
        );
}
