/* =========================================
   HENNA BOOKING APPLICATION
   GOOGLE APPS SCRIPT VERSION
========================================= */

"use strict";


/* =========================================
   CONFIGURATION
========================================= */

/*
   WhatsApp number that receives the booking.

   Country code + number.
   Do not use +, spaces or brackets.
*/

const WHATSAPP_NUMBER = "17279676639";


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
   APPLICATION STATE
========================================= */

let bookingAvailable = false;


/* =========================================
   SET MINIMUM DATE
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
   DATE FORMATTING
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
   TIME FORMATTING
========================================= */

function formatTime(timeValue) {

    if (!timeValue) {
        return "";
    }

    const [hours, minutes] =
        timeValue.split(":");

    const time =
        new Date();

    time.setHours(
        Number(hours),
        Number(minutes),
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
   CALCULATE END TIME
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
            `${bookingDate.value}T${startTime.value}`
        );

    const durationMilliseconds =
        Number(duration.value) *
        60 *
        60 *
        1000;

    return new Date(
        start.getTime() +
        durationMilliseconds
    );
}


/* =========================================
   FORMAT END TIME
========================================= */

function formatEndTime() {

    const endTime =
        calculateEndTime();

    if (!endTime) {
        return "";
    }

    return endTime.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


/* =========================================
   UPDATE SUMMARY
========================================= */

function updateSummary() {

    const selectedArtist =
        artist.value;

    const selectedDate =
        bookingDate.value;

    const selectedStartTime =
        startTime.value;

    const selectedDuration =
        duration.value;


    if (
        !selectedArtist ||
        !selectedDate ||
        !selectedStartTime ||
        !selectedDuration
    ) {

        summaryContent.innerHTML =
            "Select an artist, date, time and duration.";

        return;
    }


    const formattedDate =
        formatDate(selectedDate);

    const formattedStart =
        formatTime(selectedStartTime);

    const formattedEnd =
        formatEndTime();


    summaryContent.innerHTML = `
        <strong>Artist:</strong>
        ${escapeHtml(selectedArtist)}
        <br>

        <strong>Date:</strong>
        ${escapeHtml(formattedDate)}
        <br>

        <strong>Time:</strong>
        ${escapeHtml(formattedStart)}
        –
        ${escapeHtml(formattedEnd)}
        <br>

        <strong>Duration:</strong>
        ${escapeHtml(selectedDuration)} hour(s)
    `;
}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;
}


/* =========================================
   SHOW STATUS
========================================= */

function showStatus(message, type) {

    statusMessage.textContent =
        message;

    statusMessage.className =
        `status-message ${type}`;
}


/* =========================================
   HIDE STATUS
========================================= */

function hideStatus() {

    statusMessage.textContent =
        "";

    statusMessage.className =
        "status-message hidden";
}


/* =========================================
   VALIDATE APPOINTMENT FIELDS
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
            `${bookingDate.value}T${startTime.value}`
        );

    const now =
        new Date();


    if (start < now) {

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

    const endDateTime =
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

        endTime:
            endDateTime
                ? endDateTime.toISOString()
                : "",

        duration:
            Number(duration.value),

        numberOfPeople:
            Number(numberOfPeople.value),

        location:
            locationInput.value.trim(),

        notes:
            notes.value.trim()
    };
}


/* =========================================
   CHECK AVAILABILITY
   GOOGLE.SCRIPT.RUN
========================================= */

function checkAvailability() {

    bookingAvailable = false;

    confirmBookingBtn.disabled =
        true;


    if (!validateAppointmentFields()) {
        return;
    }


    hideStatus();

    checkAvailabilityBtn.disabled =
        true;

    checkAvailabilityBtn.textContent =
        "Checking...";


    showStatus(
        "Checking calendar availability...",
        "loading"
    );


    const bookingData =
        getBookingData();


    google.script.run

        .withSuccessHandler(function(result) {

            console.log(
                "Availability result:",
                result
            );


            if (result && result.available) {

                bookingAvailable =
                    true;

                confirmBookingBtn.disabled =
                    false;


                showStatus(
                    "✓ Great! " +
                    bookingData.artist +
                    " is available at the selected time.",
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

        })

        .withFailureHandler(function(error) {

            console.error(
                "Availability error:",
                error
            );


            bookingAvailable =
                false;

            confirmBookingBtn.disabled =
                true;


            showStatus(
                error &&
                error.message
                    ? error.message
                    : "Unable to check calendar availability.",
                "error"
            );

        })

        .checkBookingAvailability(
            bookingData
        );


    /*
       Reset button immediately.
       Google Apps Script runs asynchronously.
    */

    setTimeout(function() {

        checkAvailabilityBtn.disabled =
            false;

        checkAvailabilityBtn.textContent =
            "🔍 Check Availability";

    }, 500);
}


/* =========================================
   CONFIRM BOOKING
   GOOGLE.SCRIPT.RUN
========================================= */

function confirmBooking(event) {

    event.preventDefault();


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


    confirmBookingBtn.disabled =
        true;

    confirmBookingBtn.textContent =
        "Booking...";


    showStatus(
        "Creating your booking and blocking the calendar...",
        "loading"
    );


    const bookingData =
        getBookingData();


    /*
       Important:
       The backend checks availability again
       before creating the calendar event.
    */

    google.script.run

        .withSuccessHandler(function(result) {

            console.log(
                "Booking result:",
                result
            );


            if (!result || !result.success) {

                bookingAvailable =
                    false;

                showStatus(
                    result &&
                    result.message
                        ? result.message
                        : "Unable to create booking.",
                    "error"
                );

                confirmBookingBtn.disabled =
                    false;

                confirmBookingBtn.textContent =
                    "🌸 Confirm Booking";

                return;
            }


            /*
               Booking successfully created.
            */

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


            bookingAvailable =
                false;

        })

        .withFailureHandler(function(error) {

            console.error(
                "Booking error:",
                error
            );


            bookingAvailable =
                false;


            showStatus(
                error &&
                error.message
                    ? error.message
                    : "Unable to create booking. Please try again.",
                "error"
            );


            confirmBookingBtn.disabled =
                false;

            confirmBookingBtn.textContent =
                "🌸 Confirm Booking";

        })

        .createHennaBooking(
            bookingData
        );
}


/* =========================================
   SHOW SUCCESS
========================================= */

function showBookingSuccess(
    data,
    result
) {

    const formattedDate =
        formatDate(data.bookingDate);

    const formattedStart =
        formatTime(data.startTime);

    const formattedEnd =
        formatEndTime();


    bookingDetails.innerHTML = `

        <strong>🌸 Booking ID:</strong>
        ${escapeHtml(result.bookingId || "")}
        <br>

        <strong>👤 Customer:</strong>
        ${escapeHtml(data.customerName)}
        <br>

        <strong>🎨 Artist:</strong>
        ${escapeHtml(data.artist)}
        <br>

        <strong>✨ Service:</strong>
        ${escapeHtml(data.service)}
        <br>

        <strong>📅 Date:</strong>
        ${escapeHtml(formattedDate)}
        <br>

        <strong>⏰ Time:</strong>
        ${escapeHtml(formattedStart)}
        –
        ${escapeHtml(formattedEnd)}
        <br>

        <strong>📍 Location:</strong>
        ${escapeHtml(data.location)}
        <br>

        <strong>👥 Number of People:</strong>
        ${escapeHtml(String(data.numberOfPeople))}
        <br>

        <strong>📞 Phone:</strong>
        ${escapeHtml(data.phone)}
    `;


    createWhatsAppLink(
        data,
        result.bookingId
    );
}


/* =========================================
   CREATE WHATSAPP LINK
========================================= */

function createWhatsAppLink(
    data,
    bookingId
) {

    const formattedDate =
        formatDate(data.bookingDate);

    const formattedStart =
        formatTime(data.startTime);

    const formattedEnd =
        formatEndTime();


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

        whatsappButton.onclick =
            function(event) {

                event.preventDefault();

                alert(
                    "WhatsApp number is not configured."
                );
            };

        return;
    }


    whatsappButton.href =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}


/* =========================================
   RESET AVAILABILITY
========================================= */

function resetAvailability() {

    bookingAvailable =
        false;

    confirmBookingBtn.disabled =
        true;

    hideStatus();
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
