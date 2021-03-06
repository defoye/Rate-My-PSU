var names = [];
var ratings = [];
var ratingSpans = [];
var htmlDocument;
var timeout = 0;
var fresh = true;
var professorURLS = [];
var componentsAdded = false;
var myFontSize;
const BLANK = "_blank";
//
/*
 * Working on calling functions on button click rather than constantly
 * checking the DOM for modification
 */
function attachClick() {

    var iframe = $('#ptifrmtgtframe').contents();
    var iframeBody = iframe.find("body");
    iframeBody.contents().find('[id^="SSR_CLSRCH_MTG1$scroll$"]').each(function(i, obj) {


    });

    $(document).ready(function(){
        $('body').on('click', 'a', function(){
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
        });
    });
}

attachEvent();

function attachEvent() {

    htmlDocument = document.querySelector('#ptifrmtgtframe').contentDocument;

    htmlDocument.addEventListener("DOMSubtreeModified", callback, false);
}

function callback() {

    if (timeout) {
        clearTimeout(timeout);
    }
    timeout = setTimeout(addProfessors, 1000);
}
/*
 * Removes and attaches event as necessary.  This ensures that the
 * functions run when they are supposed to(when the page contains
 * professor names)
 */
function addProfessors() {

    var iframe = $('#ptifrmtgtframe').contents();
    var iframeBody = iframe.find("body");

    if(iframeBody.find('[id^="INSTRUCT_MODE_DESCR"]').length) {
        componentsAdded = false;
    } else if(iframeBody.find('[id^="MTG_INSTR$"]').length) {

        // Remove the listener while it's being modified
        htmlDocument.removeEventListener("DOMSubtreeModified", callback);

        var el = htmlDocument.getElementById('MTG_INSTR$0');
        var style = window.getComputedStyle(el, null).getPropertyValue('font-size');
        var fontSize = parseFloat(style) + 1;
        myFontSize = fontSize + 'px';
        //console.log("professors here");

        if(fresh) {
            // ensure all are empty
            //if(!sameProfessors()) {
                names = [];
                ratings = [];
                ratingSpans = [];
                professorURLS = [];
            //}
            getProfessorNames();
            fresh = false;
        }// class details

        if(!componentsAdded) {
            //window.alert("add components");
            ratingSpans = [];
            addComponents();
            componentsAdded = true;
        }

        addRatings();

        // console.log(names.size);

        htmlDocument.addEventListener("DOMSubtreeModified", callback);
    }
    else {
        componentsAdded = false;
        fresh = true;
    }
}

function addRatings() {
  //console.log("rating length" + ratingSpans.length);
  for(var i = 0; i < ratingSpans.length; i++) {
    addRating(i);
  }
}

/* Creates columns and adds "Rating" and loading gif */
function addComponents() {

    var iframe = $('#ptifrmtgtframe').contents();
    var iframeBody = iframe.find("body");
    iframeBody.contents().find('[id^="SSR_CLSRCH_MTG1$scroll$"]').each(function(i, obj) {

        var tr = this.tBodies[0].children;
        var th = tr[0].children[5].cloneNode(true);

        th.innerHTML = "Rating";
        tr[0].insertBefore(th, tr[0].children[5]);

        th = tr[1].children[5].cloneNode(true);
        th.innerHTML = '<center><img src="https://2aih25gkk2pi65s8wfa8kzvi-wpengine.netdna-ssl.com/toefl/wp-content/plugins/magoosh-lazyload-comments-better-ui/assets/img/loading.gif" style="width:20px;height:20px;"></center>';
        tr[1].insertBefore(th, tr[1].children[5]);
        ratingSpans.push(th);
    });
}

function sameProfessors() {

    var iframe = $('#ptifrmtgtframe').contents();
    var iframeBody = iframe.find("body");
    var i = 0;
    iframeBody.contents().find('span[id^="MTG_INSTR$"]').each(function(i, obj) {
        if(names[i] != $(this)) return false;
        else return true;
    });
}

function getProfessorNames() {

    var iframe = $('#ptifrmtgtframe').contents();
    var iframeBody = iframe.find("body");
    var i = 0;
    iframeBody.contents().find('span[id^="MTG_INSTR$"]').each(function(i, obj) {
        names.push($(this));
        searchForProfessor(i);
        i++;
        console.log(i);

    });
    console.log(i);
}

/**
 * Emulates  the RMP search page then outputs the
 * specific ID for that professor at Penn State
 */
function searchForProfessor(profIndex) {
    var profName = names[profIndex].text();

    chrome.runtime.sendMessage({
        action: "searchForProfessor",
        method: "POST",
        url: "http://www.ratemyprofessors.com/search.jsp?queryoption=HEADER&queryBy=teacherName&schoolName=Pennsylvania+State+University&schoolID=4002&query=" + convertName(profName)
    }, function(response) {
        if (response.profLink != null) {
            //professorURLS[profIndex] = "http://www.ratemyprofessors.com/search.jsp?queryoption=HEADER&queryBy=teacherName&schoolName=Pennsylvania+State+University&schoolID=4002&query=" + convertName(profName);
            // professorURLS[profIndex] = "https://www.ratemyprofessors.com" + response.profLink;
            professorURLS.push("https://www.ratemyprofessors.com" + response.profLink);
            getOverallScore(profIndex, profName, response.profLink);
        } else {
            ratings[profIndex] = "N/A";
            // professorURLS[profIndex] = "none";
            professorURLS.push("none");
        }
    });
}

/**
 * Changes the original name into one that can be searched
 */
function convertName(original) {

    original = original.trim();
    var spaceIndex = original.indexOf(" ");
    var converted = original.substring(spaceIndex + 1) + ", " + original.substring(0, spaceIndex);

    return converted.replace(", ", "%2C+");
}
var count = 0;

/**
 * Builds on searchForProfessor, visits the URL
 * and returns the overall rating for that professor
 */
function getOverallScore(profIndex, profName, profLink) {

    chrome.runtime.sendMessage({
        action: "getOverallScore",
        method: "POST",
        url: "http://www.ratemyprofessors.com" + profLink
    }, function(response) {
        if (names[profIndex].text() === "Staff" || response.profRating == "0.0" || response.profRating.includes("Grade Received")) {
            ratings[profIndex] = "N/A";
        } else {
            ratings[profIndex] = response.profRating;
            //names[profIndex].style.color = getColor(parseFloat(response.profRating));
        }
        //professorURLS[profIndex] = "https://www.ratemyprofessors.com" + profLink;
        addRating(profIndex, profLink);
    });
}

function addRating(index, profLink) {

    if (typeof ratings[index] != 'undefined') {
        //console.log(professorURLS[index]);
        // var theURL = professorURLS[index];
        // var theURL = "https://www.ratemyprofessors.com" + profLink;
        var theURL = professorURLS[index];
        // console.log(u);
        if(theURL === "none") ratingSpans[index].innerHTML = '<center><span class="RMP_Rating" ng-style="{\'background-color\': getColor(parseFloat(ratings[index]))}">' + ratings[index] + '</span></center>';
        else ratingSpans[index].innerHTML = '<center><a href="' + theURL + '" target="' + BLANK + '" ng-style="{\'background-color\': getColor(parseFloat(ratings[index]))}">' + ratings[index] + '</a></center>';

        ratingSpans[index].style.backgroundColor = getColor(parseFloat(ratings[index]));
        ratingSpans[index].style.fontSize = myFontSize;

        //document.getElementById('theURL').href = theURL;
        //ratingSpans
    }
}

/**
 * Color-codes the ratings
 */
function getColor(profRating) {
    if (profRating >= 3.5) {
        //return "#27AE60";   // Green
        return "rgba(39, 174, 96, .5)"; //  Transparent green
        //return "#8ef9bb";   // Light green
        //return "rgba(142, 249, 187, .5)";  // Transparent Light Green
    } else if (profRating < 2.5) {
        //return "#E74C3C";   // Red
        return "rgba(231, 76, 60, .5)";  // Transparent red
        //return "#f98477";   // Light red
        //return "rgba(249, 132, 119, .5)";  // Transparent Light Red
    } else if(isNaN(profRating)) {
        //return "#d5d8ed";   // Grey
        return "rgba(213, 216, 237, .5)";  // Transparent Grey
    } else {
        //return "#FF9800";   // Yellow
        return "rgba(255, 152, 0, .5)";  // Transparent yellow
        //return "#fcc87b";   // Light yellow
        //return "rgba(252, 200, 123, .5)";  // Transparent Light yellow
    }
}
