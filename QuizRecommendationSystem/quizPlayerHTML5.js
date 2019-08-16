var quiz;
var cover = {width: null, height: null };
var quizResults = {isPassed: null, isPerfect: null };
var shouldBookmark = true;
var showResultsPane = false;
var quizIndex;
var maxConstructedResponseLength = 1000;
var currentQuizGrade = "";
var quiz_result_id;
var subject = "";

//////////////////////////////////////////////////////////////////////////////
//
//							   ResponseArray
//
///////////////////////////////////////////////////////////////////////////

var responseArray = [];

function initializeResponseArray(quiz) {
    var i = 0;
    quiz_result_id = quiz.quiz_result_id;
    currentQuizGrade = quiz.completion_status;
    subject = quiz.subject;

    for (; i < quiz.questions.length; ++i) {
        var userAnswerId = quiz.questions[i].user_answer_id;
        var question_format_id = quiz.questions[i].question_format_id;
        if (question_format_id==1) {
            var correct = (quiz.questions[i].user_answer_id == quiz.questions[i].correct_answer_id) ? true : null;
            var response = {questionId: quiz.questions[i].question_id, answerId: userAnswerId, isCorrect: correct, question_format_id: question_format_id, quiz_result_id: quiz_result_id};

        } else {
            var response = { questionId: quiz.questions[i].question_id , open_answer_text: quiz.questions[i].open_answer_text, question_format_id: question_format_id, quiz_result_id: quiz_result_id};
        }
        responseArray.push(response);
    }
}

function setResponseArrayResponse(response) {
    var i = 0;
    while(response.questionId != responseArray[i].questionId) {
        ++i;
    }
    responseArray[i].answerId = response.answerId;
    responseArray[i].isCorrect = response.isCorrect;
    responseArray[i].open_answer_text = response.open_answer_text;
}

function removeResponseAtIndex(index) {
    responseArray[index].answerId = null;
    responseArray[index].isCorrect = null;
}

//////////////////////////////////////////////////////////////////////////////
//																			//
//								On Load										//
//																			//
//////////////////////////////////////////////////////////////////////////////

function layoutHTML5QuizPlayer() {
    $j('head').append("<link href='/shared/css/Chewy.css' rel='stylesheet' type='text/css'>");
    $j('head').append("<link href='/shared/css/base/_icons.css' rel='stylesheet' type='text/css'>");
    $j('body').addClass("quiz");

    $j("#contentArea").append('<div class="quizWrapper forceFitNav" id="quizContent" position:relative;"></div>');
    $j("#quizContent").append('<div class="quizHeader"></div>');
    $j("#quizContent").append('<div class="quizContent" role="main"></div>');
    $j(".quizContent").append('<h2 class="question" tabindex="-1"></h2>');
    $j(".quizContent").append('<div class="answers"><ul></ul></div>');
    $j(".quizContent").append('<div id="results" style="display:none;"></div>');
    $j(".quizContent").append('<button type="button" role="navigation" class="pageArrowForward" id="forward-page">Next</button>');
    $j(".quizContent").append('<button type="button" role="navigation" class="pageArrowBack" id="back-page" aria-hidden="true">Back</button></div>');

    $j(".quizHeader").append('<ul class="quizNav" role="navigation" aria-label="quiz questions"></ul>');
    if(!isPreview && allowReadFromQuiz) {
        $j(".quizHeader").append('<div class="bookReference" role="complementary"></div>');
        if (!fromAssessment ) {
            if ($j('#html5QuizPlayerEnabled').val() == true) {
                if ($j('#readResourceDeploymentId').val()) {
                    var readAgainHref = "/main/Activity/id/" + $j('#readResourceDeploymentId').val() + "/ReadFromQuiz/" + $j('#quizResourceDeploymentId').val() + getAssignmentUrlParam();
                    $j(".bookReference").append('<a class="returnToBook" href="'+readAgainHref+'"><span class="readAgain">Read Again</span></a>');
                    $j(".bookReference").append('<a class="returnToBook" href="'+readAgainHref+'" aria-hidden="true"><img class="bookCover" id="coverImg" border="0" ></img></a>');
                } else if ($j('#listenResourceDeploymentId').val()) {
                    var listenAgainHref = "/main/Activity/id/" + $j('#listenResourceDeploymentId').val() + '/ReadFromQuiz/' + $j('#quizResourceDeploymentId').val() + getAssignmentUrlParam();
                    $j(".bookReference").append('<a class="returnToBook" href="'+listenAgainHref+'"><span class="readAgain">Read Again</span></a>');
                    $j(".bookReference").append('<a class="returnToBook" href="'+listenAgainHref+'"><img class="bookCover" id="coverImg" border="0"></img></a>');
                }
            } else {
                $j(".bookReference").attr("onclick", "toggleQuizContent();");
                $j(".bookReference").append('<span class="readAgain">Read Again</span>');
                $j(".bookReference").append('<img class="bookCover" id="coverImg" border="0"></img>');
            }
        } else if(fromAssessment && isPhonicsSubject) {
            var readAgainHref = "/main/AssessmentRead/id/" + $j('#readResourceId').val() +"/site/headsprout"+"/ReadFromQuiz/" + $j('#quizResourceDeploymentId').val();
            $j(".bookReference").append('<a class="returnToBook" href="'+readAgainHref+'"><span class="readAgain">Read Again</span></a>');
            $j(".bookReference").append('<a class="returnToBook" href="'+readAgainHref+'"><img class="bookCover" id="coverImg" border="0"></img></a>');
        }
    }

    $j("#flashVersion").hide();

    // Make contentArea unhighlightable
    $j("#contentArea").css("-webkit-user-select","none");
    $j("#contentArea").css("-webkit-touch-callout","none");
    $j("#contentArea").css("-khtml-user-select","none");
    $j("#contentArea").css("-moz-user-select","none");
    $j("#contentArea").css("-ms-user-select","none");
    $j("#contentArea").css("user-select","none");
}

function loadResponseAudio() {
    if(!fromAssessment) {
        $j("#results").append("<audio id='resultsReread' src='/quiz_resources/global/v2_results_reread.mp3'></audio>");
        $j("#results").append("<audio id='resultsRetake' src='/quiz_resources/global/v2_results_retake.mp3'></audio>");
        $j("#results").append("<audio id='resultsSuper' src='/quiz_resources/global/v2_results_super.mp3'></audio>");
    } else if (subject != 'phonics') {
        $j("#results").append("<audio id='resultsAssessment' src='/quiz_resources/global/v2_assessment_results_fail.mp3'></audio>");
    }
}

function getNoOfCRQuestions() {
    var i = 0; var length = quiz.questions.length;
    var crque_count=0;
    for(; i < length; ++i) {
        var	format_id = quiz.questions[i].question_format_id;
        if(format_id == 2) {
            crque_count++;
        }
    }
    return crque_count;
}

function generateButtons() {
    var i = 0; var length = quiz.questions.length;
    for(; i < length; ++i) {
        var addSpan = "";
        if(quiz.questions[i].question_format_id ==1) {
            var isAnswered = (quiz.questions[i].user_answer_id) ? "active " : "";
        } else if(quiz.questions[i].question_format_id ==2) {
            var isAnswered = (quiz.questions[i].open_answer_text) ? "active " : "";
        }

        if (quiz.quiz_result_id != null) {
            if(quiz.questions[i].correct_answer_id == quiz.questions[i].user_answer_id) {
                isAnswered += "correct";
                addSpan = "<span class='icon icon-ok'></span>";
            } else if(quiz.questions[i].question_format_id ==2) {
                isAnswered = $j(".quizNav").removeClass("active");
            } else {
                isAnswered += "incorrect";
                addSpan = "<span class='icon icon-remove'></span>";
            }
        }

        var label = ((isAnswered == "active ") ? "answered question" : "unanswered question" )+(i+1);
        var appendString = "<li><button type='button' class='button " + isAnswered + "' aria-label=' "+ label + "'>" + ((addSpan != "") ? addSpan : (i + 1)) + "</button></li>";
        $j(".quizNav" ).append(appendString);
    }
    $j(".quizNav").append("<li><button type='button' id='done' class='button doneOff' aria-disabled='true'>Done</button></li>");
    enableDoneButtonIfQuizComplete();
}

function generateButtonsForReadOnly() {
    var i = 0; var length = quiz.questions.length;
    for(; i < length; ++i) {
        var isAnswered = (quiz.questions[i].user_answer_id) ? "active correct " : "";
        var appendString = "<li><button type='button' class='button " + isAnswered + "'  aria-disabled='true'>" + (i + 1) + "</button></li>";
        $j(".quizNav" ).append(appendString);
    }
    $j(".quizNav").append("<li><button type='button' class='button doneOff' >Done</button></li>");
}

function showResults(makeVisible) {
    var answerDisplay = (makeVisible) ? "none" : "block";
    var resultDisplay = (makeVisible) ? "flex" : "none";
    $j(".answers").css("display", answerDisplay);
    $j("#results").css("display", resultDisplay);

    if(makeVisible) {
        $j(".question").empty();
        var doneButtonIndex = $j(".doneOn").parent().index();
        changeQuizNav(doneButtonIndex);
        //resizeResultsDiv();
        showResultsPane = true;
    }
}

function attachHTML5QuizHandlers() {
    $j(".answers").on("click", ".audioSpan", function() {
        pauseAndResetAudioClips();
        $j(this).siblings("audio")[0].play();
    });

    $j(".question").on("click", ".audioSpan", function() {
        pauseAndResetAudioClips();
        $j(this).siblings("audio")[0].play();
    });

    $j("#results").on("click", ".audioSpan", function() {
        playAudioResponse();
    });

    $j(".quizNav").on("click", ".button", function() {
        if(!$j(this).hasClass("disabled")) {
            if($j(this).hasClass("doneOn") || $j(this).hasClass("doneOff")) {
                if($j(this).hasClass("doneOn") && showResultsPane) {
                    showResults(true);
                }
                else if($j(this).hasClass("doneOn") && !showResultsPane) {
                    submitAnswers();
                }
            } else {
                changeQuestion($j(this).parent().index());
            }
        }
    });

    $j(".pageArrowForward").on("click", function() {
        getQuizNumber();
        var quizNumber = quizIndex + 1;
        if (quizNumber == quiz.questions.length) {
            if (showResultsPane) {
                showResults(true);
            } else {
                submitAnswers();
            }
        } else {
            if (quizNumber == quiz.questions.length && $j('a.button.doneOff')) {
                $j('.pageArrowForward').hide();
            } else {
                $j('.pageArrowForward').show();
            }
            changeQuestion(quizNumber);
        }
    });

    $j(".pageArrowBack").on("click", function() {
        getQuizNumber();
        var quizNumber = quizIndex - 1;
        $j('.pageArrowForward').hide();
        changeQuestion(quizNumber);
    });

    $j(".answers").on("click", "button", function() {
        selectAnswer($j(this).parent().index());
    });
    $j(".answers").on("input", ".crAnswerBox", function() {
        selectCRAnswer($j(".crAnswerBox").val());
    });

    $j(".backBtn").click(function(event) {
        event.preventDefault();
        bookmarkAndRedirect(true, null);
    });

    $j(window).on('beforeunload', function() {
        bookmarkAndRedirect(false, document.activeElement.className);
    });
}

function getQuizNumber() {
    $j( ".quizNav li" ).each(function( index ) {
        var imgHtml = $j(this).html();
        if ($j(imgHtml).hasClass("selected")) {
            quizIndex = index;
        }
    });
}

function changeQuizDataForReadOnly() {
    var i = 0; var length = quiz.questions.length;
    for(; i < length; ++i) {
        if(quiz.questions[i].question_format_id != 2) {
            quiz.questions[i].user_answer_id = quiz.questions[i].correct_answer_id;
            var questionId = quiz.questions[i].question_id;
            var answerId = quiz.questions[i].correct_answer_id
            var isCorrect = true;
            var response = {questionId: questionId, answerId: answerId, isCorrect: isCorrect};
            setResponseArrayResponse(response);
        }
    }
}

//////////////////////////////////////////////////////////////////////////////
//																			//
//								Actions										//
//																			//
//////////////////////////////////////////////////////////////////////////////

function selectAnswer(answerToSelect) {

    var currentQuestion = $j(".quizNav .selected");
    if(!isCurrentQuestionCorrect()) {
        $j(".answers").find(".active").removeClass("active");
        $j(".answers ul li:eq(" + answerToSelect + ")").children().addClass("active");

        var answerNumber = $j(".answers ul li:eq(" + answerToSelect + ")");
        var questionNumber = currentQuestion.parent().index();
        var questionId = quiz.questions[questionNumber].question_id;
        var answerId   = quiz.questions[questionNumber].choices[answerNumber.index()].answer_id;
        var isCorrect  = quiz.questions[questionNumber].choices[answerNumber.index()].is_correct;
        var response = { questionId: questionId, answerId: answerId, isCorrect: isCorrect };
        setResponseArrayResponse(response);

        if(!isDoneButton(currentQuestion)) {
            currentQuestion.html(currentQuestion.parent().index() + 1);
        }

        enableDoneButtonIfQuizComplete();
        showResultsPane = false;
    }

    shouldBookmark = true;
}

function selectCRAnswer(constructedResponse) {
    var currentQuestion = $j(".quizNav .selected");
    var questionNumber = currentQuestion.parent().index();
    var questionId = quiz.questions[questionNumber].question_id;
    var open_answer_text = null;
    var isCorrect = null;
    if(constructedResponse){
        open_answer_text= constructedResponse;
        var response = { questionId: questionId, open_answer_text: open_answer_text, isCorrect: isCorrect };
        setResponseArrayResponse(response);

        if(!isDoneButton(currentQuestion)) {currentQuestion.html(currentQuestion.parent().index() + 1);}

        enableDoneButtonIfQuizComplete();
        showResultsPane = false;
    } else {
        open_answer_text= "";
        var response = { questionId: questionId, open_answer_text: open_answer_text, isCorrect: isCorrect };
        setResponseArrayResponse(response);
    }
}

function changeQuestion(questionIndex) {
    $j(".question").focus();
    pauseAndResetAudioClips();
    showResults(false);

    changeQuizNav(questionIndex);
    changeQuestionText(questionIndex);
    changeAnswers(questionIndex);
    checkmarkAnswerIfQuestionIsCorrect(questionIndex);

    $j(".bookReference a.returnToBook").each(function() {
        $j(this).removeClass("disabled");
    });

    if (currentQuizGrade == "perfect" && isAllAnswersCorrect()) {
        disableDoneButton();
        $j(".bookReference a.returnToBook").each(function() {
            $j(this).addClass("disabled");
        });
    }

    shouldBookmark = true;

    //resizeHTML5QuizPlayer();
    $j("audio").on("loadeddata", function() {
        if($j(this).siblings("span").hasClass("audioLoad")) {
            $j(this).siblings("span").addClass("audioSpan").removeClass("audioLoad");
        }
    });

    if($j('.pageArrowForward') && (questionIndex+2 <= quiz.questions.length)) {
        $j('.pageArrowForward').attr('aria-label', 'next to question '+ (questionIndex+2)) }
    else {
        $j('.pageArrowForward').attr('aria-label', 'Done');
    }
    if($j('.pageArrowBack'))  $j('.pageArrowBack').attr('aria-label', 'back to question '+ (questionIndex)) ;
}

function submitAnswers() {
    shouldBookmark = false;
    showLoadingScreen(true);

    SubmitDataFromResponseArray();

}

//////////////////////////////////////////////////////////////////////////////
//																			//
//							Submit Functions								//
//																			//
//////////////////////////////////////////////////////////////////////////////

function submitCallback(data) {

    quizResults.isPassed = data.is_passed;
    quizResults.isPerfect = data.is_perfect;
    quizResults.activityId = data.activity_id;

    // Self paced completion = 500, enhanced/targeted completion = 100
    // If a HS benchmark ep is completed, assignment_completion_stars == 100 and we need to go to the benchmark reward page instead
    if (hasCompletedAssignment(data.assignment_completion_stars, subject)) {
        redirectToActivityRewardPage();
    } else {
        showLoadingScreen(false);
        showResults(true);
        resetResultsDiv();
    }
    determineAndSetResultsHtml(data);
    $j(".doneOn").addClass("selected");

    // Mark question buttons as correct or incorrect
    var quizDisabled = false;
    $j(".quizNav .button").each(function(index) {
        if(!$j(this).hasClass("doneOn")  && index != quiz.questions.length) {
            $j(this).removeClass("correct").removeClass("incorrect");
            var inNavText;
            var classToAdd;
            if(responseArray[index].isCorrect) {
                inNavText = "<span class='icon icon-ok'></span>";
                $j(this).attr('aria-label', 'correct');
                classToAdd = "correct";
            } else if (responseArray[index].open_answer_text != undefined) {
                $j(this).removeClass("active");
            } else {
                inNavText = "<span class='icon icon-remove'></span>";
                $j(this).attr('aria-label', 'incorrect');
                classToAdd = "incorrect";
                removeResponseAtIndex(index);
            }

            if(data.disable_quiz == "1") {
                $j(this).removeClass("active");
                $j(this).addClass("disabled");
                $j(this).attr('aria-disabled', true);
                $j(this).parent().attr("href","#");
                quizDisabled = true;
            } else {
                $j(this).removeClass("selected");
                if (responseArray[index].open_answer_text == undefined)
                    $j(this).addClass("active " + classToAdd);
            }

            $j(this).html(inNavText);
        }
    });

    if (quizDisabled) {
        $j(".ebookActivities .bookActivity").each(function() {
            if ($j(this).find('img').attr("src") == "/shared/images/ebook_html5/btn-bookActivity-quiz.png") {
                $j(this).addClass("disabled");
                $j(this).removeAttr("onclick");
            }
        });
    }

    // If not all answers are correct, disable the done button
    if(data.number_of_correct_answers < data.number_of_questions) {
        disableDoneButton();

        if(data.disable_quiz) {
            $j(".doneOff").addClass("disabled").removeClass("selected");
        }
    }
    else {
        enableDoneButtonIfQuizComplete();
    }

    //resizeResultsDiv();
    playAudioResponse(data.is_passed, data.is_perfect, fromAssessment);

    function redirectToActivityRewardPage() {
        if(typeof BadgeNotificationManager !== 'undefined') {
            var manager = BadgeNotificationManager.getInstance();
            manager.onNextBadgeDisplayComplete(function() {
                window.clg.windowService.replaceRedirect('/main/ActivityReward/id/' + $j('#quizResourceDeploymentId').val());
            })
        } else {
            window.clg.windowService.replaceRedirect('/main/ActivityReward/id/' + $j('#quizResourceDeploymentId').val());
        }
    }
}

function getDataFromResponse(data) {
    return {
        activity_id : $j(data).find("activity_id").text(),
        activity_type : $j(data).find("activity_type").text(),
        activity_format : $j(data).find("activity_format").text(),
        number_of_questions : $j(data).find("number_of_questions").text(),
        number_of_correct_answers : $j(data).find("number_of_correct_answers").text(),
        grade : $j(data).find("grade").text(),
        is_passed : $j(data).find("is_passed").text(),
        is_perfect : $j(data).find("is_perfect").text(),
        stars_earned : $j(data).find("stars_earned").text(),
        was_perfect : $j(data).find("was_perfect").text(),
        was_passed : $j(data).find("was_passed").text(),
        assignment_completion_stars : $j(data).find("assignment_completion_stars").text(),
        disable_quiz : $j(data).find("disable_quiz").text(),
        additional_stars_earned: $j(data).find("additional_stars_earned").text()
    }
}

function getCompletedQuizActivity(quiz) {
    var i = 0;
    var number_of_correct_answers = 0;
    var completion_status = (quiz.completion_status ? quiz.completion_status : "");
    for(; i < quiz.questions.length; ++i){
        question_format_id = quiz.questions[i].question_format_id;
        if (quiz.questions[i].correct_answer_id == quiz.questions[i].user_answer_id)
            number_of_correct_answers++;
    }

    score = (number_of_correct_answers / quiz.questions.length) * 100;
    var is_perfect = ((score == 100) ? "true" : "");
    var is_passed = ((score >= 80) ? "true" : "");
    var grade = ((is_perfect) ? "perfect" : (is_passed) ? "passed" : "failed");

    return {
        activity_type : "quiz",
        activity_format : "html quiz",
        number_of_questions : quiz.questions.length,
        number_of_correct_answers : number_of_correct_answers,
        grade : grade,
        is_passed : "",
        is_perfect : "",
        was_perfect : ((completion_status == "perfect") ? "true" : "false"),
        was_passed : ((completion_status == "passed") ? "true" : "false"),
        disable_quiz : null
    }
}

function determineAndSetResultsHtml(data) {
    var resultsString = "You have <span>" + data.number_of_correct_answers + " out of " + data.number_of_questions + "</span> right answers.";
    $j("#resultsScore h1").html(resultsString);
    $j("#resultsScore").focus();
    $j('.pageArrowBack').hide();
    $j('.pageArrowBack').attr('aria-hidden', true);
    additionalStarsEarned = parseInt(data.additional_stars_earned || 0);
    starsEarned = parseInt(data.stars_earned);
    if (data.assignment_completion_stars >= "100" || subject == 'phonics') {
        starsEarned += parseInt(data.assignment_completion_stars);
    }

    currentQuizGrade = data.grade;
    // Determine which image to show

    if(!fromAssessment) {
        if(!data.is_passed) {
            resultsImg = "<img class='robot-noStars rewardPage_robotImage' src='/images/robot-fail.png' alt='Nice Try. Read the book again or try again.' />";
        }
        else {
            if(!data.is_perfect) {
                if(data.was_passed) {
                    resultsImg = "<img class='rewardPage_robotImage robot-noStars' src='/images/robot-passed-noStars.png' alt='Good Job' />";
                } else {
                    resultsImg = "<img class='rewardPage_robotImage' src='/images/robot-passed.png' alt='Nice Job!' /><span class='rewardPage_numStars'>"+starsEarned+"</span>";
                }
            } else {
                if(data.was_perfect) {
                    resultsImg = "<img alt='Awesome!' class='robot-noStars rewardPage_robotImage' src='/images/robot-perfect-noStars.png' />";
                } else {
                    resultsImg = "<img alt='Awesome! You earned stars!'  class='rewardPage_robotImage' src='/images/robot-perfect.png' /><span class='rewardPage_numStars'>"+starsEarned+"</span>";
                }
            }
        }
    } else {
        resultsImg = "<img alt='Awesome! You earned stars!' src='/images/robot-assessment.png' class='rewardPage_robotImage' /><span class='rewardPage_numStars'>"+starsEarned+"</span>";
    }

    resultsImg += "</img></div>";

    if (additionalStarsEarned > 0 && data.is_passed){
        additionalStars = "<h1 style=\"color: white; margin: auto;\">+"+additionalStarsEarned+" for Double-Star Book!</h1>\n" +
            "</div>";
    } else {
        additionalStars = "<style>.doubleStar{display: none;}</style></div>";
    }

    // Determine which audio message to play
    var audioString = "";
    if(!fromAssessment)
    {
        if (data.disable_quiz){
            $j(".quiz.activity_link").addClass("is-disabled").removeAttr('onclick').removeAttr('href');
            $j(".quiz_icon.quiz").addClass("is-disabled");
            if (data.is_quiz_locked) {
                $j('.removeMe').remove();
                var bindings = {status: {isLocked : true, isDisabled: false},
                    resourceTitle: resourceTitle.replace(/'/g, ''),
                    quizActivityUrl: quizInfo.href + getAssignmentUrlParam(),
                    unlockActivityUrl: (!!readInfo.href ? readInfo.href : listenInfo.href) + getAssignmentUrlParam(),
                    unlockActivityAction: (!!readInfo.href ? 'read' : 'listen to'),
                    isLargeIcon: true};
                injectAngularComponent($j('.rewardPage_activities.rewardPage_activities-quiz'), 'student-resource-delivery-quiz', bindings, null);
            }
        }
        if(!data.is_passed) {
            if (data.was_passed) {
                audioString = "<span class='audioSpan subHeading'>You did not pass this quiz. Read the book again, or try a different book.</span>";
            } else {
                audioString = "<span class='audioSpan subHeading'>You did not pass this quiz. <span  class='audioSpan subHeading' aria-hidden='true'>Select the items with a <span class='icon icon-remove'></span></span><span class='visuallyHidden'>Go to incorrect items</span> and choose the correct answers to earn stars. Use the book to help you find the correct answers.</span>";
                if (data.disable_quiz == "1") audioString = "<span class='audioSpan subHeading'>You did not pass this quiz. Read the book again before retaking the quiz.</span>";
            }
        }
        else if(!data.is_perfect) {
            audioString = "<span class='audioSpan subHeading' aria-hidden='true'>Click on the items with a <span class='icon icon-remove'></span></span><span class='audioSpan subHeading'> <span class='visuallyHidden'> Go to incorrect items</span>, and choose the correct answers to earn more stars. Use the book to help you find the correct answers.</span>";
        }
        else {
            audioString = "<span class='audioSpan subHeading'>Super! You answered all of the questions correctly!</span>";
        }
    }
    else {
        if(data.is_perfect) {
            audioString = "Super! You answered all of the questions correctly! ";
        }

        if (subject == 'phonics') {
            audioString += "You have completed your benchmark!";
        } else {
            audioString += "You have completed your 3 step assignment!";
        }

    }

    $j("#resultsAudioString").html(audioString);
    $j("#resultsImgDiv").html(resultsImg);
    $j("#additionalStars").html(additionalStars);
    $j('.pageArrowForward').not('.pageArrowForward-home').hide();
    getQuizNumber();
    disableDoneButton();
}

function isQuizCompletionReturnDataValid(data){
    return !(data === null || data.error);
}

function showRecommendation(data){
    if(data.recommendation != undefined){
        if(data.recommendation.href != null){
            $j('#resultsScore').append('<div class="recommendationLink"><a href= "' + data.recommendation.href+ '">' + data.recommendation.title + '</a></div>');
        }
        else{
            $j('#resultsScore').append('<div class="recommendationLink">' + data.recommendation.title + '</div>');
        }
    }
}

function SubmitDataFromResponseArray() {
    var i = 0;
    var choice_answers = {};
    var open_answers = {};

    var returnData;
    var question_format_id;

    for(; i < responseArray.length; ++i){
        question_format_id = quiz.questions[i].question_format_id;
        if((responseArray[i].answerId)&&(question_format_id==1)) {
            choice_answers[responseArray[i].questionId] = responseArray[i].answerId;

        } else if(question_format_id==2){
            open_answers[responseArray[i].questionId] = responseArray[i].open_answer_text;
        }
    }

    $j.ajax({
        url : "/main/RecordStudentQuizCompletion",
        data: { "resource_deployment_id": html5ResourceDeploymentId, "choice_answers" : choice_answers, "open_answers": open_answers, "student-assignment-id": activityInfo.studentAssignmentId},
        type: "POST",
        success: function(data) {
            if (!isQuizCompletionReturnDataValid(data)) {
                window.clg.windowService.replaceRedirect('/main/StudentPortal');
                return;
            }
            submitCallback(data);
            showRecommendation(data);
            $j(".bookReference a.returnToBook").each(function() {
                var _href = $j(this).attr("href");
                pattern = "";
                if (data.activity_id != undefined && parseInt(data.activity_id) > 0)
                    pattern = "/fromResults/"+data.activity_id;
                if(!~_href.indexOf(pattern)) {
                    $j(this).attr("href", _href + pattern);
                }
                $j(this).addClass("disabled");
            });
        },
        error:function(){
            showLoadingScreen(false);
            showErrorScreen(true);
        }});
}
function playAudioResponse() {
    if(!fromAssessment) {
        if(!quizResults.isPassed) {
            $j("#resultsReread")[0].play();
        }
        else if(!quizResults.isPerfect) {
            $j("#resultsRetake")[0].play();
        }
        else {
            $j("#resultsSuper")[0].play();
        }
    } else if (subject != 'phonics') {
        $j("#resultsAssessment")[0].play();
    }
}

//////////////////////////////////////////////////////////////////////////////
//																			//
//							Question Change									//
//																			//
//////////////////////////////////////////////////////////////////////////////

function changeQuizNav(questionIndex) {
    var selected = $j(".quizNav").find(".selected").removeClass("selected");
    var selectedQuestionIndex = selected.parent().index();
    var isAnswered = false;
    if(selectedQuestionIndex >= 0 ){
        if(quiz.questions[selectedQuestionIndex]){
            var correct_answer_id = quiz.questions[selectedQuestionIndex].correct_answer_id;
            if(correct_answer_id){
                if ($j(".answers").find(".active").length>0 ){
                    isAnswered = true;
                }
            } else if ($j(".crAnswerBox").val()){
                if ($j(".crAnswerBox").val().length>0 ){
                    isAnswered = true;
                }
            }
        }
    }else{
        if ($j(".answers").find(".active").length>0 ){
            isAnswered = true;
        }
    }

    if((isAnswered && !isDoneButton(selected)) || isCompletedQuestion(selected)) {
        selected.addClass("active");
        selected.attr('aria-label', 'answered question'+(selectedQuestionIndex+1));
    } else {

        selected.removeClass("active");
    }
    var chosen = $j(".quizNav .button:eq(" + questionIndex + ")");
    chosen.removeClass("active");
    chosen.addClass("selected");
    getQuizNumber();
    var quizNumber = quizIndex;
    if (quizIndex == 0) {
        $j(".pageArrowBack").hide();
        $j('.pageArrowBack').attr('aria-hidden', true);
    } else {
        $j(".pageArrowBack").show();
        $j('.pageArrowBack').attr('aria-hidden', false);
    }

    $j(".question").show();
    $j(".pageArrowForward-home").hide();
    if (quizNumber + 1 == quiz.questions.length && isQuizComplete()){
        $j('#forward-page').show();
        $j(".quizContent").removeClass("rewardPage");
    } else if (quizNumber + 1 >= quiz.questions.length && !isQuizComplete()) {
        if ($j('a.button.doneOn').hasClass("selected")) {
            $j(".question").hide();
            $j(".quizContent").addClass("rewardPage book-landscape");
            setResultsNavigationLinks();
        } else if (quizNumber + 1 == quiz.questions.length) {
            $j('.pageArrowForward').hide();
            $j(".quizContent").removeClass("rewardPage");
        }
    } else {
        $j(".quizContent").addClass("rewardPage");
        if(quizNumber + 1 < quiz.questions.length) {
            $j('#forward-page').show();
            $j('.pageArrowForward').removeClass('pageArrowForward-done').text('Next');
            $j(".quizContent").removeClass("rewardPage");
        } else {
            setResultsNavigationLinks();
        }
    }

    if(isPreview && quizNumber + 1 == quiz.questions.length && isQuizComplete()) {
        $j('#forward-page').hide();
    }

}

function isAllAnswersCorrect() {
    var totalCorrect = 0;
    var totalMultipleChoice = 0
    $j( ".quizNav li" ).each(function( index ) {
        if ($j(this).find('a').hasClass("correct")) {
            totalCorrect++;
        }
        if ($j(this).find('a').hasClass("correct") || $j(this).find('a').hasClass("incorrect")) {
            totalMultipleChoice++;
        }
    });

    if (totalCorrect == totalMultipleChoice && totalCorrect > 0) {
        return true;
    }

    return false;
}

function changeQuestionText(questionIndex) {
    $j(".question").empty();

    var question = quiz.questions[questionIndex];
    var questionText = replaceImageAndAudioIfPossible(question.question, question.images, false, question.question_audio);
    $j(".question").html(questionText);

}

function changeAnswers(questionIndex) {
    $j(".answers").children().empty();

    var correct_answer_id = quiz.questions[questionIndex].correct_answer_id;

    if (isCurrentQuestionCorrect())
        responseArray[questionIndex].isCorrect = true;

    var wordCountDiv = 'wordCount';

    if(correct_answer_id){
        var i = 0; var numChoices = quiz.questions[questionIndex].choices.length;
        for(; i < numChoices; ++i) {
            var choice = quiz.questions[questionIndex].choices[i];
            var answerText = replaceImageAndAudioIfPossible(choice.answer, choice.images, true, choice.answer_audio);
            var currentQuestionCorrect = isCurrentQuestionCorrect();
            var answerLinkId = 'choice-' + (questionIndex + 1) + '-' + (i + 1);
            var appendString = "<li><button type='button' role='button' aria-disabled="+ currentQuestionCorrect +" id="+answerLinkId+" class='answerBtnLink'";

            appendString += (isCurrentQuestionCorrect()) ? "><span  class='answersBtn disabled'>" : "><span class='answersBtn'>";
            appendString += String.fromCharCode(65 + i) +  "</span><span class='visuallyHidden'>"+ answerText + "</span></button> ";
            appendString += "<span class='answerText' id='answerText'>" + answerText + "</span></li>";

            $j(".answers").children("ul").append(appendString);

            if (isSelectedAnswer(questionIndex, choice.answer_id)) {
                $j('#' + answerLinkId).addClass('active');
            }
        }


    } else if (responseArray[questionIndex].open_answer_text && responseArray[questionIndex].open_answer_text.length > 1 && quiz.questions[questionIndex].question_format_id == 2) {
        var appendAnswerBox ='<li>';
        var isChrome = window.chrome;
        var openAnswerLength;
        if(isChrome) {
            openAnswerLength =  responseArray[questionIndex].open_answer_text.replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .replace(/\n/g, '\r\n').length;
        } else {
            openAnswerLength = responseArray[questionIndex].open_answer_text.length;
        }
        var charactersRemaining = maxConstructedResponseLength - openAnswerLength;
        appendAnswerBox +='<span class="width100">';
        appendAnswerBox +='<label class="box lg"><strong class="floatR" id="wordCount">' + charactersRemaining + '</strong></label>';
        appendAnswerBox +='<textarea id="answerTextArea" maxlength=' + maxConstructedResponseLength + ' class="crAnswerBox active">';
        appendAnswerBox +='</textarea>';
        appendAnswerBox += "</span></li>";
        $j(".answers").children("ul").append(appendAnswerBox);
        $j(".crAnswerBox").text(responseArray[questionIndex].open_answer_text);
        $j('#answerTextArea').keyup(function() {
            clg.commonUtils.textAreaWordCountDown(maxConstructedResponseLength, this, wordCountDiv);
        });
    } else {
        var appendAnswerBox ='<li>';
        appendAnswerBox +='<span class="width100">';
        appendAnswerBox +='<label class="box lg"><strong class="floatR" id="wordCount">' + maxConstructedResponseLength + '</strong></label>';
        appendAnswerBox +='<textarea id="answerTextArea" maxlength =' + maxConstructedResponseLength + ' class="crAnswerBox" placeholder="Type your answer here...">';
        appendAnswerBox +='</textarea>';
        appendAnswerBox += "</span></li>";
        $j(".answers").children("ul").append(appendAnswerBox);
        $j('#answerTextArea').keyup(function() {
            clg.commonUtils.textAreaWordCountDown(maxConstructedResponseLength, this, wordCountDiv);
        });
    }
}

function replaceImageAndAudioIfPossible(originalText, imageArray, isAnswer, audioUrl) {
    if(imageArray !== undefined) {
        // Pulls out the digits in the string "{img:ddd}"
        var imageId = originalText.match(/{img:(\d+)}/);

        var img = "<img src=" + imageArray[imageId[1]].url;
        img += (isAnswer) ? " class='choiceImg'>" : " class='questionImg'>";

        originalText = originalText.replace(/{img:[\d]+}/, img);
    }

    if(audioUrl !== undefined && audioUrl != "") {
        originalText = "<span class='audioLoad'>" + originalText + "</span>";
        originalText += "<audio src='" + audioUrl + "'></audio>";
    }

    return originalText;
}

function checkmarkAnswerIfQuestionIsCorrect(questionIndex) {
    if(isCurrentQuestionCorrect()) {
        var index = getIndexOfCorrectAnswer(questionIndex);
        var correctAnswer = $j(".answers ul li:eq(" + index + ") a");
        var correctAnswerText = $j(".answers ul li:eq(" + index + ") #answerText").text();
        correctAnswer.html("<span class='answersBtn correct'><span class='visuallyHidden'>correct answer</span><span class='visuallyHidden'>"+ correctAnswerText + "</span><span class='icon icon-ok'></span></span>");
    }
}

function getIndexOfCorrectAnswer(questionIndex) {
    var i = 0;
    var numChoices = quiz.questions[questionIndex].choices.length;
    for(; i < numChoices; ++i) {
        if(quiz.questions[questionIndex].choices[i].answer_id == responseArray[questionIndex].answerId) {
            return i;
        }
    }
}

//////////////////////////////////////////////////////////////////////////////
//																			//
//								Misc										//
//																			//
//////////////////////////////////////////////////////////////////////////////

function resetResultsDiv() {
    $j("#results").children(":not(audio)").remove();

    var selected = $j(".quizNav").find(".selected");
    if (isDoneButton(selected)) {
        $j(".quizContent").addClass("rewardPage book-landscape");
        if(allowReturnHome) {
            $j(".quizContent").append("<a class='pageArrowForward-home icon-homeC' id='resultsHome' href='" + navigationLink + "'><span>Home</span></a>");
        }
    }

    if ($j('#results').css("display") == "flex") {
        $j('#results').addClass("rewardPage_results");
        $j(".question").hide();
        setResultsNavigationLinks();
    }

    if (fromAssessment) {
        $j("#results").append("<div id='resultsScore' class='rewardPage_message rewardPage_message-quiz' tabindex='0'><p id='resultsAudioString'></p></div>");
        setupBenchmarkRewardPage();
    } else {
        $j("#results").append("<div id='resultsScore' class='rewardPage_message rewardPage_message-quiz' tabindex='0'><h1></h1><p id='resultsAudioString'></p></div>");
    }

    $j("#results").append("<div class='rewardRobot' id='resultsImgDiv'></div>");
    $j("#results").append("<div class='doubleStar' id='additionalStars'></div>");
    var assignmentParam = getAssignmentUrlParam();
    if (canFavoriteResource) {
        $j('#results').append(
            "<div class='favorite-button'>" +
            "<button id='favorite_"+ kidsBookId +"' class='favorite' title='Add to Favorites!'><span class='favoriteBtn'></span></button>" +
            "<span id='favoriteDisabled' style='display:none'>Could not favorite this item. Try again later.</span>" +
            "</div>"
        );
        if (isFavorite) {
            $j('.favorite').addClass('is-active');
        }
        var favorite = clg.razKids.FavoriteController($j);
        $j('.favorite').click(function(){
            favorite.toggleFavorite($j(this));
        });
    }
    if (listenInfo.resourceDeploymentId && !fromAssessment) {
        $j("#results").append(
            "<a aria-label='listen' class='listen activity_link activityIconContainer' href='"+listenInfo.href+assignmentParam+"'>" +
            "	<span class='icon activity_icon activity_icon-lg icon-listenC'></span>" +
            "</a>"
        );
        if (listenInfo.completionStatus == "true") {
            $j(".activityIconContainer.listen").addClass("activityIconContainer-perfect");
        }
    }
    if (readInfo.resourceDeploymentId && !fromAssessment) {
        $j("#results").append(
            "<a aria-label='read' class='read activity_link activityIconContainer' href='"+readInfo.href+assignmentParam+"'>" +
            "	<span class='icon activity_icon activity_icon-lg icon-readC'></span>" +
            "</a>"
        );
        if (readInfo.completionStatus == "true") {
            $j(".activityIconContainer.read").addClass("activityIconContainer-perfect");
        }
    }

    if (quizInfo.resourceDeploymentId && !fromAssessment) {
        if (quizResults.isPerfect == "" && (quizResults.isPassed == "1" || quizResults.isPassed == "")) {
            $j("#results").append(
                "<a id='goToFirstIncorrectQuestion' aria-label='quiz' class='removeMe quiz-icon quiz activity_link activityIconContainer' href='#'>" +
                "	<span class='icon  activity_icon activity_icon-lg icon-quizC'></span>" +
                "</a>"
            );
            $j('#goToFirstIncorrectQuestion').click(function() {
                goToFirstIncorrectQuestion();
                return false;
            });
        } else {
            $j("#results").append(
                "<a aria-label='quiz' class='removeMe quiz-icon quiz activity_link quiz_icon activityIconContainer' href='"+quizInfo.href+assignmentParam+"'>" +
                "	<span class='icon activity_icon activity_icon-lg icon-quizC'></span>" +
                "</a>"
            );
        }

        if (quizInfo.completionStatus == "perfect" || quizResults.isPerfect) {
            $j(".activityIconContainer.quiz").addClass("activityIconContainer-perfect");
        } else if (quizInfo.completionStatus == "passed" || quizResults.isPassed) {
            $j(".activityIconContainer.quiz").addClass("activityIconContainer-complete");
        }
    }
    $j('.activity_link').wrapAll( "<div class='rewardPage_activities rewardPage_activities-quiz' />");
}
function resetResultsCompletionDiv() {
    $j("#results").children(":not(audio)").remove();

    var selected = $j(".quizNav").find(".selected");
    if (isDoneButton(selected)) {
        $j(".quizContent").addClass("rewardPage book-landscape");
        if(allowReturnHome) {
            $j(".quizContent").append("<a class='pageArrowForward pageArrowForward-home' id='resultsHome' href='" + navigationLink + "'>Home</a>");
        }
    }

    $j(".question").hide();
    setResultsNavigationLinks();

    $j("#results").append("<div id='resultsScore' class='rewardPage_message rewardPage_message-quiz' tabindex='0'><h1></h1><p id='resultsAudioString'></p></div>");
    $j("#results").append("<div class='rewardRobot' id='resultsImgDiv'></div>");
    $j("#results").append("<div class='doubleStar' id='additionalStars'></div>");
    $j("#results").append("<h1 class='resultsHeading marginB5'>Assignment Complete!</h1>");
}

function setResultsNavigationLinks() {
    $j("#forward-page").hide();
    $j("#back-page").hide();
    if(allowReturnHome) {
        $j(".pageArrowForward.pageArrowForward-home").show();
        $j(".pageArrowForward.pageArrowForward-home").text('Home');
    } else {
        $j(".pageArrowForward.pageArrowForward-home").hide();
    }
}

function setupBenchmarkRewardPage() {
    if($j(".backBtn").length === 0) {
        if (subject === 'phonics') {
            $j(".ebookHeader").prepend("<div><a href='" + navigationLink + "' class='backBtn'>Headsprout</a></div>");
        } else if (subject === 'reading') {
            $j(".ebookHeader").prepend("<div><a href='" + navigationLink + "' class='backBtn'>Reading</a></div>");
        }
    }
    $j(".quizNav").remove();
    $j(".quizHeader").css("height",60);
    $j(".quizContent.rewardPage").css("padding-bottom",0);
}

function showLoadingScreen(showLoad) {
    if(showLoad) {
        $j("#contentArea").prepend("<div id='quizLoading'></div>");
        $j("#quizLoading").height($j("#quizContent").height());
        $j("#quizContent").hide();
    }
    else {
        $j("#quizLoading").remove();
        $j("#quizContent").show();
    }
}

function showErrorScreen(showError) {
    if(showError) {
        $j("#contentArea").prepend("<div id='quizError'></div>")
        $j("#quizError").height("100%");
        $j("#quizContent").remove();

        $j("#quizError").prepend("<div class='errorMessage'>Error encountered when recording quiz results.<br>Please try again.</div>");
        $j("#quizError").prepend("<div class='errorSpacer'></div>");
    }
    else {
        $j("#quizError").remove();
        $j("#quizContent").show();
    }
}

function pauseAndResetAudioClips() {
    var audioTags = $j("audio");
    if(audioTags) {
        audioTags.each(function() {
            var audioElement = $j(this)[0];
            if(audioElement.duration) {
                audioElement.pause();
                audioElement.currentTime = 0;
            }
        });
    }
}

function isDoneButton(button) {
    return (button.hasClass("doneOn") || button.hasClass("doneOff"));
}

function isCompletedQuestion(button) {
    return (button.hasClass("correct") || button.hasClass("incorrect"));
}

function isCurrentQuestionCorrect() {
    return $j(".quizNav .button.selected").hasClass("correct");
}

function isSelectedAnswer(questionIndex, answerId) {
    return (responseArray[questionIndex].answerId == answerId);
}

function isQuizComplete() {
    var i = 0; var complete = true;
    var length = responseArray.length;
    for(; i <length; ++i) {
        if(responseArray[i].question_format_id ==1 && !responseArray[i].answerId){
            complete = false;
        }
    }
    return complete;
}

function enableDoneButtonIfQuizComplete() {
    if(isQuizComplete() && !isPreview) {
        $j(".doneOff").removeClass("doneOff").addClass("doneOn");
        $j(".doneOn").attr('aria-disabled', false);
        if ($j('.question').css("display") == "block")
            $j('#forward-page').show();
    }
}

function disableDoneButton() {
    $j(".doneOn").removeClass("doneOn").addClass("doneOff");
    $j(".doneOff").attr('aria-disabled', true);
}

function disableQuestions() {
    $j(".quizNav a").each(function() {
        $j(this).removeAttr("href");
        $j(this).removeClass("active").addClass("disabled");
    });
}

function zeroPad(number, width) {
    number = number.toString();
    while(number.length < width) {
        number = "0" + number;
    }

    return number;
}

function validateAndZeroIndexStartQuestionNumber(quiz) {
    if(quiz.start_question_number >= 1 && quiz.start_question_number <= quiz.questions.length) {
        return quiz.start_question_number - 1; // Comes in 1-indexed, must be 0-indexed
    }
    else {
        return 0;
    }
}

function atLeastOneQuestionAnswered() {
    for(var i = 0; i < responseArray.length; ++i) {
        if(responseArray[i].answerId || responseArray[i].open_answer_text) {
            return true;
        }
    }
    return false;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//																													//
//											Bookmarking Functions													//
//																													//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function bookmarkAndRedirect(leave, caller) {
    var i = 0;
    var choice_answers = {};
    var open_answers = {};
    var returnData;
    var question_format_id;

    for(; i < responseArray.length; ++i){
        question_format_id = quiz.questions[i].question_format_id;
        if(question_format_id==1) {
            choice_answers[responseArray[i].questionId] = responseArray[i].answerId;
        } else if(question_format_id==2){
            open_answers[responseArray[i].questionId] = responseArray[i].open_answer_text;
        }
    }

    if (currentQuizGrade == "perfect" && quiz_result_id == null && isAllAnswersCorrect()) shouldBookmark = false;
    if (caller != "returnToBook" && currentQuizGrade == "passed") shouldBookmark = false;
    if(shouldBookmark && atLeastOneQuestionAnswered()) {
        var currentQuestion = $j(".quizNav .button.selected");
        var questionNumber = currentQuestion.parent().index() + 1; // Must be 1-indexed

        shouldBookmark = false;
        $j.ajax({
            url : '/main/HTML5QuizPlayerService/action/bookmark_incomplete_quiz',
            data: {' kidsBookId':kidsBookId, 'resource_deployment_id': html5ResourceDeploymentId, 'withinQuiz':1, 'questionNumber': questionNumber, 'choice_answers' : choice_answers, 'open_answers': open_answers},
            type: "POST",
            async: false,
            success: function(data) {
                bookmarkCallback(data, caller);
            },
            error:function(){
                bookmarkFailure(data);
                showLoadingScreen(false);
                showErrorScreen(true);
            }
        });
    }
    else if(leave) {
        window.clg.windowService.redirect($j('.backBtn').attr('href'));
    }
}

function bookmarkCallback(data, caller) {
    if (caller) {
        window.clg.windowService.redirect($j('.'+caller).attr('href'));
    } else {
        window.clg.windowService.redirect($j('.backBtn').attr('href'));
    }
}

function bookmarkFailure(data) {
    window.clg.windowService.redirect($j('.backBtn').attr('href'));
}

function goToFirstIncorrectQuestion() {
    questionIndex = 0;
    $j(".quizNav .button").each(function(index) {
        if ($j(this).hasClass("incorrect")) {
            questionIndex = index;
            return false;
        }
    });
    changeQuestion(questionIndex);
}

function getAssignmentUrlParam() {
    var assignmentParam = "";
    if (activityInfo.studentAssignmentId != "false" && $j.isNumeric(activityInfo.studentAssignmentId)) {
        assignmentParam = '/student-assignment-id/' + activityInfo.studentAssignmentId;
    }
    return assignmentParam;
}

function injectAngularComponent(injectElement, componentName, componentBindings, id){
    "use strict";
    angular.element(document.body).injector().invoke(
        ['$compile', '$rootScope', function ($compile, $rootScope) {
            if (injectElement.length > 0) {
                if ($j('#' + id).length < 1) { // Dont inject the same component twice
                    var customElement = createCustomElementWithBindings(componentName, componentBindings, id);
                    var linkFn = $compile(customElement);
                    var scope = $rootScope.$new();
                    angular.extend( scope, componentBindings);
                    var newElement = linkFn( scope);
                    injectElement.append(newElement);
                }
            }
        }]);
}

function createCustomElementWithBindings(componentName, componentBindings, id) {
    var customElement = '<' + componentName + ' id="' + id + '"';
    if( !!componentBindings){
        for( var key in componentBindings){
            customElement += ' ';
            customElement += clg.commonUtils.camelCaseToKebabCase(key);
            customElement += '=\'';
            customElement += JSON.stringify(componentBindings[key]);
            customElement += '\'';
        }
    }
    customElement += '>';
    customElement += '</' + componentName + '>';
    return customElement;
}

function hasCompletedAssignment(assignmentCompletionStars, subject) {
    return assignmentCompletionStars == "500" || (assignmentCompletionStars == "100" && subject != 'phonics');
}