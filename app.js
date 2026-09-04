/* =========================================
   HENNA ART BOOKING
   GITHUB PAGES FRONTEND
========================================= */

"use strict";


/* =========================================
   CONFIGURATION
========================================= */

/*
   IMPORTANT:
   Replace this with your deployed
   Google Apps Script Web App URL.

   Example:

   https://script.google.com/macros/s/XXXXXXXXXXXX/exec
*/

const GOOGLE_APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwVfZzRJH66Xo5AA4Q7fe1Dtkb6emSV9vdspXRgA3Thm88w4N3vsJRIPWv5SD6NKKNMug/exec";


/*
   WhatsApp number.

   Country code + phone number.
   No +, spaces or brackets.
*/

const WHATSAPP_NUMBER =
    "17279676639";


/* =========================================
   DOM ELEMENTS
========================================= */

const bookingForm =
    document.getElementById("bookingForm");

const customerName =
    document.getElementById("customerName");

const phone =
    document.getElementById("phone");

const email =
    document.getElementById("email");

const artist =
    document.getElementById("artist");

const service =
    document.getElementById("service");

const bookingDate =
    document.getElementById("bookingDate");

const startTime =
    document.getElementById("startTime");

const duration =
    document.getElementById("duration");

const numberOfPeople =
    document.getElementById("numberOfPeople");

const locationInput =
    document.getElementById("location");

const notes =
    document.getElementById("notes");

const checkAvailabilityBtn =
    document.getElementById("checkAvailabilityBtn");

const confirmBookingBtn =
    document.getElementById("confirmBookingBtn");

const statusMessage =
    document.getElementById("statusMessage");

const summaryContent =
    document.getElementById("summaryContent");

const successCard =
    document.getElementById("successCard");

const bookingDetails =
    document.getElementById("bookingDetails");

const whatsappButton =
    document.getElementById("whatsappButton");

const newBookingBtn =
    document.getElementById("newBookingBtn");


/* =========================================
   STATE
========================================= */

let bookingAvailable = false;
let requestInProgress = false;


/* =========================================
   DATE
========================================= */

function setMinimumDate() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    bookingDate.min =
        `${year}-${month}-${day}`;
}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date =
        new Date(`${dateValue}T00:00:00`);

    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


/* =========================================
   FORMAT TIME
========================================= */

function formatTime(timeValue) {

    if (!timeValue) {
        return "";
    }

    const parts =
        timeValue.split(":");

    const hours =
        Number(parts[0]);

    const minutes =
        Number(parts[1]);

    const time =
        new Date();

    time.setHours(
        hours,
        minutes,
        0,
        0
    );

    return time.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


/* =========================================
   END TIME
========================================= */

function calculateEndTime() {

    if (
        !bookingDate.value ||
        !startTime.value ||
        !duration.value
    ) {
        return null;
    }

    const start =
        new Date(
            `${bookingDate.value}T${startTime.value}:00`
        );

    return new Date(
        start.getTime() +
        Number(duration.value) *
        60 *
        60 *
        1000
    );
}


/* =========================================
   FORMAT END TIME
========================================= */

function formatEndTime() {

    const end =
        calculateEndTime();

    if (!end) {
        return "";
    }

    return end.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value == null ? "" : String(value);

    return div.innerHTML;
}


/* =========================================
   UPDATE SUMMARY
========================================= */

function updateSummary() {

    if (
        !artist.value ||
        !bookingDate.value ||
        !startTime.value ||
        !duration.value
    ) {

        summaryContent.innerHTML =
            "Select an artist, date, time and duration.";

        return;
    }

    summaryContent.innerHTML = `

        <strong>Artist:</strong>
        ${escapeHtml(artist.value)}
        <br>

        <strong>Date:</strong>
        ${escapeHtml(
            formatDate(bookingDate.value)
        )}
        <br>

        <strong>Time:</strong>
        ${escapeHtml(
            formatTime(startTime.value)
        )}
        –
        ${escapeHtml(
            formatEndTime()
        )}
        <br>

        <strong>Duration:</strong>
        ${escapeHtml(duration.value)}
        hour(s)

    `;
}


/* =========================================
   STATUS
========================================= */

function showStatus(
    message,
    type
) {

    statusMessage.textContent =
        message;

    statusMessage.className =
        `status-message ${type}`;
}


function hideStatus() {

    statusMessage.textContent =
        "";

    statusMessage.className =
        "status-message hidden";
}


/* =========================================
   VALIDATE
========================================= */

function validateAppointmentFields() {

    if (!artist.value) {

        showStatus(
            "Please select a Henna artist.",
            "error"
        );

        return false;
    }

    if (!bookingDate.value) {

        showStatus(
            "Please select an event date.",
            "error"
        );

        return false;
    }

    if (!startTime.value) {

        showStatus(
            "Please select a start time.",
            "error"
        );

        return false;
    }

    if (!duration.value) {

        showStatus(
            "Please select an appointment duration.",
            "error"
        );

        return false;
    }

    const start =
        new Date(
            `${bookingDate.value}T${startTime.value}:00`
        );

    if (
        Number.isNaN(start.getTime()) ||
        start.getTime() <= Date.now()
    ) {

        showStatus(
            "Please select a future date and time.",
            "error"
        );

        return false;
    }

    return true;
}


/* =========================================
   GET BOOKING DATA
========================================= */

function getBookingData() {

    const end =
        calculateEndTime();

    return {

        customerName:
            customerName.value.trim(),

        phone:
            phone.value.trim(),

        email:
            email.value.trim(),

        artist:
            artist.value,

        service:
            service.value,

        bookingDate:
            bookingDate.value,

        startTime:
            startTime.value,

        duration:
            Number(duration.value),

        numberOfPeople:
            Number(numberOfPeople.value),

        location:
            locationInput.value.trim(),

        notes:
            notes.value.trim(),

        endTime:
            end
                ? end.toISOString()
                : ""
    };
}


/* =========================================
   JSONP BACKEND REQUEST
========================================= */

function callBackend(
    action,
    data
) {

    return new Promise(
        function(resolve, reject) {

            if (
                !GOOGLE_APPS_SCRIPT_URL ||
                GOOGLE_APPS_SCRIPT_URL.includes(
                    "PASTE_YOUR_WEB_APP_URL_HERE"
                )
            ) {

                reject(
                    new Error(
                        "Google Apps Script Web App URL has not been configured."
                    )
                );

                return;
            }


            const callbackName =
                "hennaCallback_" +
                Date.now() +
                "_" +
                Math.floor(
                    Math.random() * 100000
                );


            const params =
                new URLSearchParams();


            params.set(
                "action",
                action
            );


            params.set(
                "callback",
                callbackName
            );


            Object.keys(data || {})
                .forEach(function(key) {

                    const value =
                        data[key];

                    if (
                        value !== undefined &&
                        value !== null
                    ) {

                        params.set(
                            key,
                            String(value)
                        );
                    }

                });


            const script =
                document.createElement(
                    "script"
                );


            let finished =
                false;


            const cleanup =
                function() {

                    if (
                        script.parentNode
                    ) {

                        script.parentNode
                            .removeChild(script);
                    }

                    try {

                        delete window[
                            callbackName
                        ];

                    } catch (error) {

                        window[
                            callbackName
                        ] = undefined;
                    }
                };


            const timeout =
                setTimeout(
                    function() {

                        if (finished) {
                            return;
                        }

                        finished = true;

                        cleanup();

                        reject(
                            new Error(
                                "The server did not respond. Please try again."
                            )
                        );

                    },
                    30000
                );


            window[callbackName] =
                function(response) {

                    if (finished) {
                        return;
                    }

                    finished = true;

                    clearTimeout(timeout);

                    cleanup();

                    resolve(response);
                };


            script.onerror =
                function() {

                    if (finished) {
                        return;
                    }

                    finished = true;

                    clearTimeout(timeout);

                    cleanup();

                    reject(
                        new Error(
                            "Unable to connect to the booking server."
                        )
                    );
                };


            script.src =
                GOOGLE_APPS_SCRIPT_URL +
                "?" +
                params.toString();


            document.body.appendChild(
                script
            );
        }
    );
}


/* =========================================
   CHECK AVAILABILITY
========================================= */

async function checkAvailability() {

    if (requestInProgress) {
        return;
    }

    bookingAvailable =
        false;

    confirmBookingBtn.disabled =
        true;


    if (
        !validateAppointmentFields()
    ) {
        return;
    }


    requestInProgress =
        true;

    checkAvailabilityBtn.disabled =
        true;

    confirmBookingBtn.disabled =
        true;

    checkAvailabilityBtn.textContent =
        "Checking...";


    showStatus(
        "Checking calendar availability...",
        "loading"
    );


    try {

        const data =
            getBookingData();


        const result =
            await callBackend(
                "checkAvailability",
                data
            );


        console.log(
            "Availability result:",
            result
        );


        if (
            result &&
            result.success &&
            result.available
        ) {

            bookingAvailable =
                true;

            confirmBookingBtn.disabled =
                false;


            showStatus(
                `✓ Great! ${data.artist} is available at the selected time.`,
                "success"
            );

        } else {

            bookingAvailable =
                false;

            confirmBookingBtn.disabled =
                true;


            showStatus(
                result &&
                result.message
                    ? result.message
                    : "Sorry, this time is already booked. Please select another time.",
                "error"
            );
        }

    } catch (error) {

        console.error(
            "Availability error:",
            error
        );


        bookingAvailable =
            false;

        confirmBookingBtn.disabled =
            true;


        showStatus(
            error.message ||
            "Unable to check calendar availability.",
            "error"
        );

    } finally {

        requestInProgress =
            false;

        checkAvailabilityBtn.disabled =
            false;

        checkAvailabilityBtn.textContent =
            "🔍 Check Availability";
    }
}


/* =========================================
   CONFIRM BOOKING
========================================= */

async function confirmBooking(event) {

    event.preventDefault();


    if (requestInProgress) {
        return;
    }


    if (!bookingForm.checkValidity()) {

        bookingForm.reportValidity();

        return;
    }


    if (!bookingAvailable) {

        showStatus(
            "Please check availability before confirming your booking.",
            "error"
        );

        return;
    }


    requestInProgress =
        true;


    confirmBookingBtn.disabled =
        true;

    checkAvailabilityBtn.disabled =
        true;

    confirmBookingBtn.textContent =
        "Booking...";


    showStatus(
        "Creating your booking and blocking the calendar...",
        "loading"
    );


    try {

        const bookingData =
            getBookingData();


        /*
           The server performs
           another availability check
           while holding a lock.
        */

        const result =
            await callBackend(
                "createBooking",
                bookingData
            );


        console.log(
            "Booking result:",
            result
        );


        if (
            !result ||
            !result.success
        ) {

            bookingAvailable =
                false;

            showStatus(
                result &&
                result.message
                    ? result.message
                    : "Unable to create booking.",
                "error"
            );

            return;
        }


        /*
           SUCCESS
        */

        bookingAvailable =
            false;


        showBookingSuccess(
            bookingData,
            result
        );


        hideStatus();


        bookingForm.classList.add(
            "hidden"
        );

        successCard.classList.remove(
            "hidden"
        );


        successCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


    } catch (error) {

        console.error(
            "Booking error:",
            error
        );


        bookingAvailable =
            false;


        showStatus(
            error.message ||
            "Unable to create booking. Please try again.",
            "error"
        );


    } finally {

        requestInProgress =
            false;

        checkAvailabilityBtn.disabled =
            false;

        confirmBookingBtn.disabled =
            true;

        confirmBookingBtn.textContent =
            "🌸 Confirm Booking";
    }
}


/* =========================================
   SUCCESS DETAILS
========================================= */

function showBookingSuccess(
    data,
    result
) {

    const formattedDate =
        formatDate(
            data.bookingDate
        );

    const formattedStart =
        formatTime(
            data.startTime
        );

    const endTime =
        calculateEndTime();


    const formattedEnd =
        endTime
            ? endTime.toLocaleTimeString(
                "en-US",
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            )
            : "";


    bookingDetails.innerHTML = `

        <strong>🌸 Booking ID:</strong>
        ${escapeHtml(
            result.bookingId || ""
        )}
        <br>

        <strong>👤 Customer:</strong>
        ${escapeHtml(
            data.customerName
        )}
        <br>

        <strong>🎨 Artist:</strong>
        ${escapeHtml(
            data.artist
        )}
        <br>

        <strong>✨ Service:</strong>
        ${escapeHtml(
            data.service
        )}
        <br>

        <strong>📅 Date:</strong>
        ${escapeHtml(
            formattedDate
        )}
        <br>

        <strong>⏰ Time:</strong>
        ${escapeHtml(
            formattedStart
        )}
        –
        ${escapeHtml(
            formattedEnd
        )}
        <br>

        <strong>📍 Location:</strong>
        ${escapeHtml(
            data.location
        )}
        <br>

        <strong>👥 Number of People:</strong>
        ${escapeHtml(
            String(data.numberOfPeople)
        )}
        <br>

        <strong>📞 Phone:</strong>
        ${escapeHtml(
            data.phone
        )}

    `;


    createWhatsAppLink(
        data,
        result.bookingId
    );
}


/* =========================================
   WHATSAPP
========================================= */

function createWhatsAppLink(
    data,
    bookingId
) {

    const formattedDate =
        formatDate(
            data.bookingDate
        );

    const formattedStart =
        formatTime(
            data.startTime
        );

    const end =
        calculateEndTime();

    const formattedEnd =
        end
            ? end.toLocaleTimeString(
                "en-US",
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            )
            : "";


    const message =

`🌸 *NEW HENNA BOOKING*

🆔 Booking ID: ${bookingId || "N/A"}

👤 Customer: ${data.customerName}
📞 Phone: ${data.phone}
📧 Email: ${data.email || "N/A"}

🎨 Artist: ${data.artist}
✨ Service: ${data.service}

📅 Date: ${formattedDate}
⏰ Time: ${formattedStart} - ${formattedEnd}
⌛ Duration: ${data.duration} hour(s)

📍 Location:
${data.location}

👥 Number of People: ${data.numberOfPeople}

📝 Notes:
${data.notes || "No additional notes"}

✅ Calendar has been blocked for this appointment.`;


    if (!WHATSAPP_NUMBER) {

        whatsappButton.href =
            "#";

        return;
    }


    whatsappButton.href =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}


/* =========================================
   RESET
========================================= */

function resetAvailability() {

    bookingAvailable =
        false;

    confirmBookingBtn.disabled =
        true;
}


/* =========================================
   NEW BOOKING
========================================= */

function createNewBooking() {

    bookingForm.reset();

    bookingForm.classList.remove(
        "hidden"
    );

    successCard.classList.add(
        "hidden"
    );


    resetAvailability();

    hideStatus();

    updateSummary();

    setMinimumDate();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================
   EVENT LISTENERS
========================================= */

[
    artist,
    bookingDate,
    startTime,
    duration
].forEach(function(element) {

    element.addEventListener(
        "change",
        function() {

            resetAvailability();

            hideStatus();

            updateSummary();
        }
    );
});


checkAvailabilityBtn.addEventListener(
    "click",
    checkAvailability
);


bookingForm.addEventListener(
    "submit",
    confirmBooking
);


newBookingBtn.addEventListener(
    "click",
    createNewBooking
);


/* =========================================
   INITIALIZE
========================================= */

setMinimumDate();

updateSummary();

