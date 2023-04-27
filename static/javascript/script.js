let audio1 = new Audio("./static/assets/audio/monkey_repel.mp3");
let audio2 = new Audio("./static/assets/audio/cat_dog_repel.mp3");
let audio3 = new Audio("./static/assets/audio/elephant_repel.mp3");
let audio4 = new Audio("./static/assets/audio/lion_leopard_repel.mp3");
let audio5 = new Audio("./static/assets/audio/sheep_cattle_repel.mp3");
let audio = audio1;

function loopAudio() {
    this.currentTime = 0;
    this.play();
}

let noAnimal = -1
async function checkAnimal(animalList) {
    if (animalList.length == 0 || animalList[0] == "person") {
        if (noAnimal == -1 || ++noAnimal > 3) {
            if (!audio.paused) {
                noAnimal = -1;
                audio.removeEventListener("ended", loopAudio);
                audio.pause();
            }
            return;
        }
    }

    if (audio.paused) {
        if (animalList[0] == 'cat' || animalList[0] == 'dog') {
            audio = audio2;
        } else if (animalList[0] == 'elephant' || animalList[0] == 'bear') {
            audio = audio3;
        } else if (animalList[0] == 'horse' || animalList[0] == 'zebra') {
            audio = audio4;
        } else if (animalList[0] == 'sheep' || animalList[0] == 'cow') {
            audio = audio5;
        } else {
            audio = audio1;
        }
        noAnimal = 0;
        audio.addEventListener('ended', loopAudio);
        audio.currentTime = 0;
        audio.play();
    }
}

let startBtn = document.getElementById('startVid');
let stopBtn = document.getElementById('stopVid');
let canvas = document.getElementById("canvas");
let context = null;
const video = document.querySelector("#videoElement");
let elem = document.getElementById("elem");
let timeout = null;
let pressStart = document.getElementsByClassName("pressStart")[0];

if (startBtn) {
    startBtn.addEventListener('click', startVideo);
    stopBtn.addEventListener('click', stopVideo);
    video.addEventListener("playing", videoStarted);
}

let videoPlaying = false;
function startVideo(e) {
    context = canvas.getContext("2d");
    video.width = elem.getAttribute("width");
    video.height = elem.getAttribute("height");
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
            })
            .catch(function (err0r) {
                alert("Something went wrong! Cannot open Webcam");
            });
    }
    pressStart.classList.add("z-n1");
    videoPlaying = true;
}

function stopVideo(e) {
    videoPlaying = false;
    let stream = video.srcObject;
    if (stream != null) {

        let tracks = stream.getTracks();

        for (let i = 0; i < tracks.length; i++) {
            let track = tracks[i];
            track.stop();
        }

    }
    video.srcObject = null;

    clearTimeout(timeout);

    context.fillStyle = "#666";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg");
    photo.setAttribute("src", data);

    audio.removeEventListener("ended", loopAudio);
    audio.pause();
    setTimeout(() => {
        pressStart.classList.remove("z-n1")
    }, 500);
}

function videoStarted() {
    // const FPS = 0.8;
    const FPS = 3.2;
    timeout = setInterval(() => {
        width = video.width;
        height = video.height;
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", width);
        context.drawImage(video, 0, 0, width, height);
        let data = canvas.toDataURL("image/jpeg", 0.4);
        let mydata = { image: data };
        //console.log(data);
        context.clearRect(0, 0, width, height);
        fetch("/detectImg", {
            method: "POST",
            body: JSON.stringify(mydata),
        })
            .then((response) => response.json())
            .then((json) => {
                if (videoPlaying) {
                    photo.setAttribute("src", json.image);
                    checkAnimal(json.detectedList);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }, 1000 / FPS);
}

let searchTableBtn = document.getElementById("searchTableInp");
let reportTable = document.getElementById("reportTable");
let sortTableBtn = document.getElementById("sortTableBtn");
let datepicker = document.getElementById("datepicker");
let clearBtn = document.getElementById("clearBtn");
let downloadReportBtn = document.getElementById("downloadReportBtn");

if (sortTableBtn) {
    sortTableBtn.addEventListener("click", sortTableDesc);
    searchTableBtn.addEventListener("keyup", filterTable);
    datepicker.addEventListener("change", filterTable);
    datepicker.addEventListener("click", toggleDatePicker);
    clearBtn.addEventListener("click", clearFilter);
    downloadReportBtn.addEventListener("click", downloadReport);
}

function filterTable() {
    let filter = searchTableBtn.value.toLowerCase();
    let filter2 = datepicker.value.toLowerCase();
    if (filter2 != "") {
        filter2 = formatDate(new Date(filter2));
    }
    for (let i = 1; i < reportTable.rows.length; i++) {
        let row = reportTable.rows[i];
        let animalName = row.cells[1].innerText.toLowerCase();
        let dateCol = row.cells[2].innerText;
        if (animalName.indexOf(filter) > -1 && dateCol.indexOf(filter2) > -1) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    }
}

let sortClick = 0;
function sortTableDesc() {
    sortClick++;
    let sortingDir = "asc";
    if (sortClick == 2) {
        sortingDir = "desc";
        sortClick = 0;
    }
    let rows, i, j, minIndex, x, y;
    rows = reportTable.rows;
    for (i = 1; i < rows.length - 1; i++) {
        minIndex = i;
        x = reverseFormatDate(rows[minIndex].children[2].innerText);
        x = new Date(x);
        for (j = i + 1; j < rows.length; j++) {
            y = reverseFormatDate(rows[j].children[2].innerText)
            y = new Date(y);
            if (sortingDir == "desc") {
                if (x < y) {
                    minIndex = j;
                    x = y;
                }
            } else {
                if (y < x) {
                    minIndex = j;
                    x = y;
                }
            }
        }
        if (minIndex !== i) {
            rows[i].parentNode.insertBefore(rows[minIndex], rows[i]);
        }
    }
}

function toggleDatePicker() {
    datepicker.showPicker();
}

function formatDate(date) {
    let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
    let month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date);
    let day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date);
    let formatedDate = `${day}-${month}-${year}`
    return formatedDate;
}

function reverseFormatDate(date) {
    let arr = date.split('-');
    let [day, month, year] = arr;
    let formatedDate = `${year}-${month}-${day}`
    return formatedDate;
}

function clearFilter() {
    let rows = reportTable.rows
    searchTableBtn.value = "";
    datepicker.value = "";
    for (let i = 1; i < rows.length; i++) {
        let row = rows[i];
        row.style.display = "";
    }
    let i, j, minIndex, x, y;
    for (i = 1; i < rows.length - 1; i++) {
        minIndex = i;
        x = rows[minIndex].children[0].innerText;
        for (j = i + 1; j < rows.length; j++) {
            y = rows[j].children[0].innerText
            if (y < x) {
                minIndex = j;
                x = y;
            }
        }
        if (minIndex !== i) {
            rows[i].parentNode.insertBefore(rows[minIndex], rows[i]);
        }
    }
}

function downloadReport() {
    const data = [];
    for (let i = 1; i < reportTable.rows.length; i++) {
        if (reportTable.rows[i].style.display != "none") {
            const cells = reportTable.rows[i].cells;
            const rowData = {
                'S.No.': cells[0].innerText,
                'Animal Name': cells[1].innerText,
                'Date of Detection': cells[2].innerText,
                'Time of Detection': cells[3].innerText
            };
            data.push(rowData);
        }
    }
    fetch('/saveReport', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.ok) {
            let link = document.createElement('a');
            link.href = '/static/assets/report.xlsx';
            link.download = 'report.xlsx';
            link.click();
        } else {
            alert("Error While Generating Report");
        }
    }).catch(error => {
        console.error('Failed to send data:', error);
    });
}

let signInUsername = document.getElementById("signInUsername");
let signInPassword = document.getElementById("signInPassword");
let signInCPassword = document.getElementById("signInCPassword");
let signSubmitBtn = document.getElementById("signSubmit");
let eyebox = document.getElementById("eyebox");
let userValid = false, passwordValid = false, cPasswordValid = false;

if (signSubmitBtn) {
    signInUsername.addEventListener("blur", validateName);
    signInPassword.addEventListener("blur", validatePassword);
    signInCPassword.addEventListener("blur", validateCPassword);
    signSubmitBtn.addEventListener("click", validateSubmit);
    eyebox.addEventListener("click", togglePassword);
}

function validateName() {
    signInUsername.classList.remove("border");
    signInUsername.classList.remove("border-dark");
    if (signInUsername.value.length > 4) {
        userValid = true;
        signInUsername.classList.add("is-valid");
        signInUsername.classList.remove("is-invalid");
    } else {
        userValid = false;
        signInUsername.classList.add("is-invalid");
        signInUsername.classList.remove("is-valid");
    }
}

function validatePassword() {
    signInPassword.classList.remove("border");
    signInPassword.classList.remove("border-dark");
    regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[?!@#$%^&*])[a-zA-z\d!@#$%^&*?]{6,}$/;
    if (regex.test(signInPassword.value)) {
        passwordValid = true;
        signInPassword.classList.add("is-valid");
        signInPassword.classList.remove("is-invalid");
    } else {
        passwordValid = false;
        signInPassword.classList.add("is-invalid");
        signInPassword.classList.remove("is-valid");
    }
}

function validateCPassword() {
    signInCPassword.classList.remove("border");
    signInCPassword.classList.remove("border-dark");
    if (signInPassword.value === signInCPassword.value) {
        cPasswordValid = true;
        signInCPassword.classList.add("is-valid");
        signInCPassword.classList.remove("is-invalid");
    } else {
        cPasswordValid = false;
        signInCPassword.classList.add("is-invalid");
        signInCPassword.classList.remove("is-valid");
    }
}

function validateSubmit(e) {
    e.preventDefault();
    if (userValid && passwordValid && cPasswordValid) {
        document.getElementById("signForm").submit();
    } else {
        document.getElementById("formValid").classList.remove("d-none");
    }
}

let toggleClk = 1;
function togglePassword() {
    passInp = document.getElementById("loginPassword");
    if (toggleClk == 1) {
        eyebox.children[0].classList.add("bi-eye-slash-fill");
        eyebox.children[0].classList.remove("bi-eye-fill");
        passInp.type = "text";
        toggleClk++;
    } else {
        eyebox.children[0].classList.remove("bi-eye-slash-fill");
        eyebox.children[0].classList.add("bi-eye-fill");
        passInp.type = "password";
        toggleClk--;
    }
}