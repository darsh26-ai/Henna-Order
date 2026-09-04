/* =========================================
   HENNA ART BOOKING BACKEND
   GOOGLE APPS SCRIPT
   GITHUB PAGES COMPATIBLE
========================================= */


/* =========================================
   CONFIGURATION
========================================= */

const CONFIG = {

    SPREADSHEET_ID:
        "1OX2ij1cbagSECWV4gKfJgQLKmUMbZ1i8O7F6VTQyeow",

    SHEET_NAME:
        "Bookings",

    CALENDARS: {

        Nirali:
            "540e97f3b38f9cd5d12695552210cf07c54ae1650104300f66ea9ff6027f4615@group.calendar.google.com",

        Kaushika:
            "b319db05703e81cdb63fc2dde5ad522e4355537fe2be0a9091ad1fed345e8807@group.calendar.google.com"
    },

    TIMEZONE:
        "America/New_York"
};


/* =========================================
   GET REQUEST
========================================= */

function doGet(e) {

    try {

        e = e || {};

        const params =
            e.parameter || {};

        const action =
            params.action || "";

        const callback =
            params.callback || "";


        /*
           No action = health check.
        */

        if (!action) {

            return createResponse(
                {
                    success: true,
                    message:
                        "Henna Booking API is running."
                },
                callback
            );
        }


        const data =
            buildBookingData(params);


        let result;


        if (
            action ===
            "checkAvailability"
        ) {

            validateAction(data);

            result =
                handleCheckAvailability(
                    data
                );

        } else if (
            action ===
            "createBooking"
        ) {

            validateAction(data);

            result =
                handleCreateBooking(
                    data
                );

        } else {

            result = {

                success: false,

                message:
                    "Invalid action."
            };
        }


        return createResponse(
            result,
            callback
        );


    } catch (error) {

        console.error(error);


        return createResponse(

            {
                success: false,

                message:
                    error &&
                    error.message
                        ? error.message
                        : "Server error occurred."
            },

            e &&
            e.parameter
                ? e.parameter.callback
                : ""
        );
    }
}


/* =========================================
   BUILD BOOKING DATA
========================================= */

function buildBookingData(params) {

    return {

        customerName:
            params.customerName || "",

        phone:
            params.phone || "",

        email:
            params.email || "",

        artist:
            params.artist || "",

        service:
            params.service || "",

        bookingDate:
            params.bookingDate || "",

        startTime:
            params.startTime || "",

        duration:
            Number(params.duration || 0),

        numberOfPeople:
            Number(
                params.numberOfPeople || 0
            ),

        location:
            params.location || "",

        notes:
            params.notes || ""
    };
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


    if (!data.artist) {

        throw new Error(
            "Henna artist is required."
        );
    }


    if (
        !CONFIG.CALENDARS[
            data.artist
        ]
    ) {

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


    if (
        !data.duration ||
        Number(data.duration) <= 0
    ) {

        throw new Error(
            "Valid duration is required."
        );
    }
}


/* =========================================
   AVAILABILITY
========================================= */

function handleCheckAvailability(data) {

    const result =
        checkAvailability(data);


    return {

        success: true,

        available:
            result.available,

        message:
            result.message
    };
}


/* =========================================
   CHECK CALENDAR
========================================= */

function checkAvailability(data) {

    const calendarId =
        CONFIG.CALENDARS[
            data.artist
        ];


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
        createStartDateTime(
            data
        );


    const end =
        createEndDateTime(
            data,
            start
        );


    if (
        start.getTime() <=
        new Date().getTime()
    ) {

        return {

            available: false,

            message:
                "Please select a future date and time."
        };
    }


    /*
       CalendarApp.getEvents()
       returns events overlapping
       this time range.
    */

    const events =
        calendar.getEvents(
            start,
            end
        );


    if (
        events &&
        events.length > 0
    ) {

        return {

            available: false,

            message:
                "Sorry, " +
                data.artist +
                " is already booked during this time. Please select another time."
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
   CREATE BOOKING
========================================= */

function handleCreateBooking(data) {

    validateBookingData(
        data
    );


    const lock =
        LockService.getScriptLock();


    try {

        /*
           Prevent two customers from
           booking the same time simultaneously.
        */

        lock.waitLock(
            30000
        );


        /*
           ALWAYS check again after
           obtaining the lock.
        */

        const availability =
            checkAvailability(
                data
            );


        if (
            !availability.available
        ) {

            return {

                success: false,

                available: false,

                message:
                    availability.message
            };
        }


        /*
           Create calendar event.
        */

        const event =
            createCalendarEvent(
                data
            );


        /*
           Generate unique booking ID.
        */

        const bookingId =
            generateBookingId();


        /*
           Save to Google Sheet.
        */

        saveBookingToSheet(
            data,
            bookingId,
            event.getId()
        );


        return {

            success: true,

            available: true,

            bookingId:
                bookingId,

            calendarEventId:
                event.getId(),

            message:
                "Booking successfully created."
        };


    } finally {

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
   CREATE CALENDAR EVENT
========================================= */

function createCalendarEvent(data) {

    const calendarId =
        CONFIG.CALENDARS[
            data.artist
        ];


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
        createStartDateTime(
            data
        );


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

Created through Henna Art Booking Website.`;


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
   CREATE START DATE/TIME
========================================= */

function createStartDateTime(data) {

    const dateParts =
        String(
            data.bookingDate
        ).split("-");


    const timeParts =
        String(
            data.startTime
        ).split(":");


    if (
        dateParts.length !== 3 ||
        timeParts.length < 2
    ) {

        throw new Error(
            "Invalid booking date or time."
        );
    }


    const year =
        Number(
            dateParts[0]
        );

    const month =
        Number(
            dateParts[1]
        ) - 1;

    const day =
        Number(
            dateParts[2]
        );

    const hour =
        Number(
            timeParts[0]
        );

    const minute =
        Number(
            timeParts[1]
        );


    return new Date(

        year,
        month,
        day,
        hour,
        minute,
        0,
        0
    );
}


/* =========================================
   CREATE END DATE/TIME
========================================= */

function createEndDateTime(
    data,
    start
) {

    const milliseconds =
        Number(data.duration) *
        60 *
        60 *
        1000;


    return new Date(
        start.getTime() +
        milliseconds
    );
}


/* =========================================
   VALIDATE BOOKING
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

            const value =
                data[field];


            if (
                value === undefined ||
                value === null ||
                String(value).trim() === ""
            ) {

                throw new Error(
                    field +
                    " is required."
                );
            }
        }
    );


    if (
        Number(
            data.numberOfPeople
        ) < 1
    ) {

        throw new Error(
            "Number of people must be at least 1."
        );
    }
}


/* =========================================
   SAVE TO GOOGLE SHEET
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
       Create sheet automatically.
    */

    if (!sheet) {

        sheet =
            spreadsheet.insertSheet(
                CONFIG.SHEET_NAME
            );
    }


    /*
       Create headers.
    */

    if (
        sheet.getLastRow() === 0
    ) {

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


    /*
       Save booking.
    */

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
   BOOKING ID
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
            Math.random() *
            9000
        );


    return (
        "HENNA-" +
        timestamp +
        "-" +
        random
    );
}


/* =========================================
   JSON / JSONP RESPONSE
========================================= */

function createResponse(
    data,
    callback
) {

    const json =
        JSON.stringify(data);


    /*
       JSONP callback validation.
    */

    if (
        callback &&
        /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(
            callback
        )
    ) {

        return ContentService

            .createTextOutput(
                callback +
                "(" +
                json +
                ");"
            )

            .setMimeType(
                ContentService.MimeType.JAVASCRIPT
            );
    }


    return ContentService

        .createTextOutput(
            json
        )

        .setMimeType(
            ContentService.MimeType.JSON
        );
}

