<?php

namespace LAZ\objects\modules\razkids\ActivityReward;

use LAZ\objects\kidsaz\services\bookroom\FavoriteSessionCacheService;
use LAZ\objects\library\ActivityTypeHelper;
use LAZ\objects\modules\razkids\abstracted\StudentAbstractModel;
use LAZ\objects\razkids\StudentInfoCache;
use LAZ\objects\razkids\RKConstants;
use LAZ\objects\kidsaz\utility\ReadingAssessmentTypes;
use LAZ\objects\library\RKService;
use LAZ\objects\tools\FeatureCheck;
use LAZ\objects\shared\services\CdnService;

class ActivityRewardModel extends StudentAbstractModel {

    public function setActivityInfo() {
        $resourceDeploymentId = isset($_GET['id']) ? $_GET['id'] : null;
        parent::setActivityInfoFromResourceDeploymentId($resourceDeploymentId);
        parent::setIncompleteActivity($this->getShardConfigurationId(), $this->getStudentAccountIdByResourceDeploymentId($resourceDeploymentId), $this->activityInfo['kids_book_id']);
        if ($this->isValidActivity()) {
            $_SESSION['studentInfo']['activityInfo']['resourceDeploymentId'] = $resourceDeploymentId;
            $_SESSION['studentInfo']['activityInfo']['quizResourceDeploymentId'] = $this->getQuizResourceDeploymentId();
            $_SESSION['studentInfo']['activityInfo']['activityType'] = $this->activityInfo['activity_name'];
            $_SESSION['studentInfo']['activityInfo']['formatType'] = $this->activityInfo['format_type'];
            $_SESSION['studentInfo']['activityInfo']['resourceId'] = $this->activityInfo['kids_book_id'];
            $_SESSION['studentInfo']['activityInfo']['studentAssignmentId'] = $this->resourceDetails['student_assignment_id'];;
            if (isset($_GET['page'])) {
                $_SESSION['studentInfo']['activityInfo']['currentPage'] = $_GET['page'];
            }
        }
    }

    public function getOrientation() {
        $bookOrientation = $this->activityInfo['orientation'];
        if ($this->activityInfo['format_type'] == "interactive" || $this->activityInfo['format_type'] == "wrapper book")
            $bookOrientation = "landscape";
        return $bookOrientation;
    }

    public function getBackLinkInfo() {
        $backLinkInfo = [];

        switch (true) {
            case isset($_SESSION['score_earned']['runningRecord']) || isset($_SESSION['score_earned']['assessment']):
                $backLinkInfo['location'] = "/main/ReadingStudent";
                $backLinkInfo['linkText'] = "Reading";
                break;
            case $_SESSION['studentInfo']['booklist'][0]['assignment_type_category'] == 'headsprout':
                $backLinkInfo['location'] = "/main/HeadSproutStudent/view/assignment/start";

                if(array_key_exists('Episode', $_GET) && intval($_GET['Episode']) < 5) {
                    $backLinkInfo['location'] .= "/reward-complete/true";
                }
                $backLinkInfo['linkText'] = RKConstants::HEADSPROUT_BACKLINK;
                break;
            default:
                $backLinkInfo['location'] = $_SESSION['studentInfo']['booklistKey']['context'];
                $backLinkInfo['linkText'] = $_SESSION['studentInfo']['booklistKey']['linkText'];
                if ($_SESSION['studentInfo']['booklistKey']['studentAssignmentId']) {
                    $backLinkInfo['location'] = $backLinkInfo['location'] . '/id/' . $_SESSION['studentInfo']['booklistKey']['studentAssignmentId'];
                }
                break;
        }

        $_SESSION['come-back-url'] = $backLinkInfo['location'];

        return $backLinkInfo;
    }

    public function getActivityType() {
        return $this->activityInfo['activity_name'];
    }

    public function getActivityTitle() {
        return $this->activityInfo['title'];
    }

    public function getFormatType() {
        return $this->activityInfo['format_type'];
    }

    public function isValidRequest($resourceDeploymentId) {
        $featureCheck = new FeatureCheck();
        $bookList = &$this->getFlattenedResources($_SESSION['studentInfo']['booklist']);
        if ($bookList) {
            foreach($bookList as $book) {
                if (ReadingAssessmentTypes::isReadingAssessmentTypeCategory($book['assignment_type_category'], true)) {
                    return true;
                } else {
                    if ($featureCheck->isFeatureEnabled('VAZ_STUDENT')) {
                        foreach(['read', 'listen', 'quiz', 'watch', 'word_game', 'worksheet', 'vsc_game_practice', 'vsc_game_assessment'] as $activityType) {
                            if (isset($book['delivery']["{$activityType}"]) && $book['delivery']["{$activityType}"]['resource_deployment_id'] == $resourceDeploymentId) {
                                //TODO: Add condition that only allows word game when it's unlocked
                                if ($activityType != 'quiz' || ($book['delivery']['quiz']['active'] == "true"))
                                    return true;
                            }
                        }
                    } else {
                        foreach(['read', 'listen', 'quiz', 'watch', 'word_game', 'worksheet'] as $activityType) {
                            if (isset($book['delivery']["{$activityType}"]) && $book['delivery']["{$activityType}"]['resource_deployment_id'] == $resourceDeploymentId) {
                                //TODO: Add condition that only allows word game when it's unlocked
                                if ($activityType != 'quiz' || ($book['delivery']['quiz']['active'] == "true"))
                                    return true;
                            }
                        }
                    }
                }

                if ($_SESSION['JustCompletedHeadsproutEpisode'] && intval($_GET['Episode']) < 5 ) {
                    return true;
                }
            }
        } else if (($_SESSION['score_earned']['assignment_complete'] && ($_SESSION['score_earned']['listen'] || $_SESSION['score_earned']['read'] || $_SESSION['score_earned']['watch'])) || $_SESSION['score_earned']['runningRecord']) {
            return true;
        }
        else {
            if($this->fetchBookByResourceDeploymentId($resourceDeploymentId)) {
                return true;
            }
        }
        return false;
    }

    public function isRecordingOnlyOrMatchingAssessment() {
        $activityTypeName = $_SESSION['studentInfo']['activityInfo']['activityType'];
        $activityTypeId = ActivityTypeHelper::getActivityTypeIdByName($activityTypeName);
        return ActivityTypeHelper::isRecordingAssessment($activityTypeId) || $activityTypeId === ActivityTypeHelper::ALPHABET_MATCHING_ACTIVITY_ID;
    }

    public function getContextUrl() {
        return $_SESSION['studentInfo']['booklistKey']['context'];
    }

    public function updateBookStatus($resourceDeploymentId) {
        $thisBook = null;
        foreach($this->fetchResources($resourceDeploymentId) as &$book) {
            if ($_SESSION['studentInfo']['activityInfo']['resourceId'] == $book['kids_book_id'] &&
                $_SESSION['studentInfo']['activityInfo']['student_assignment_id'] == $book['student_assignment_id']) {

                switch ($_SESSION['studentInfo']['activityInfo']['activityType']) {
                    case "listen" :
                        $book['listen_completed'] = "true";
                        $book['listen_earned']['firstTime'] = ($_SESSION['score_earned']['listen'] > 0 && !isset($book['listen_earned']['firstTime'])) ? $book['listen_earned']['firstTime'] = true :  $book['listen_earned']['firstTime'] = false;
                        $book['listen_earned']['src'] = ($_SESSION['score_earned']['listen'] > 0 && $book['listen_earned']['firstTime'] == true) ? "/images/robot-".RKConstants::RESOURCE_PASSED.".png" : "/images/robot-".RKConstants::RESOURCE_LISTEN.".png";
                        break;
                    case "read" :
                        $book['reading_completed'] = "true";
                        $book['read_earned']['firstTime'] = ($_SESSION['score_earned']['read'] > 0 && !isset($book['read_earned']['firstTime'])) ? $book['read_earned']['firstTime'] = true : $book['read_earned']['firstTime'] = false;
                        $book['read_earned']['src'] = ($_SESSION['score_earned']['read'] > 0 && $book['read_earned']['firstTime'] == true) ? "/images/robot-".RKConstants::RESOURCE_PASSED.".png" : "/images/robot-".RKConstants::RESOURCE_READ.".png";
                        if ($book['read_earned']['timed_read_fail'] && $_SESSION['score_earned']['read'] == 0) $book['read_earned']['src'] = $book['read_earned']['timed_read_fail'];
                        break;
                    case "quiz" :
                        $book['quiz_completed'] = "true";
                        $book['quiz_earned']['src'] = ($_SESSION['score_earned']['quiz_pass'] > 0 ) ? "/images/robot-".RKConstants::RESOURCE_PASSED.".png" : "/images/robot-".RKConstants::RESOURCE_QUIZ.".png";
                        break;
                    case "watch" :
                        $book['watch_completed'] = "true";
                        $book['watch_earned']['firstTime'] = $_SESSION['score_earned']['watch'] > 0 && !isset($book['watch_earned']['firstTime']);
                        $book['watch_earned']['src'] = $book['watch_earned']['firstTime'] ? "/images/robot-".RKConstants::RESOURCE_PASSED.".png" : "/images/robot-".RKConstants::RESOURCE_WATCH.".png";
                        break;
                    case "word_game" :
                        $book['word_game_completed'] = "true";
                        $book['word_game_earned']['firstTime'] = $_SESSION['score_earned']['word_game'];
                        //TODO: Actually assign this to a proper value which refers to an image
                        $book['word_game_earned']['src'] = null;

                        //FIXME: It looks as though this should be done in CompleteActivityModel, but that never seems to get called
                        $book['word_game']['class-status'] = "activityIconContainer-perfect";
//                          $book['word_game_earned'];
                        break;
                    case "worksheet" :
                        $book['worksheet_completed'] = "true";
                        $book['worksheet_earned']['src'] = ($_SESSION['score_earned']['worksheet'] > 0) ? "/images/robot-".RKConstants::RESOURCE_PASSED.".png" : "/images/robot-".RKConstants::RESOURCE_QUIZ.".png";
                        break;
                    case "vsc_game_practice":
                        $book['vsc_game_practice_completed'] = "true";
                        $book['vsc_game_practice_earned']['src'] = ($_SESSION['score_earned']['vsc_game_practice'] > 0) ? "/images/robot-".RKConstants::RESOURCE_PASSED.".png" : "/images/robot-".RKConstants::RESOURCE_QUIZ.".png";
                        break;
                    case "vsc_game_assessment":
                        $book['vsc_game_assessment_completed'] = "true";
                        $book['vsc_game_assessment_earned']['src'] = ($_SESSION['score_earned']['vsc_game_assessment'] > 0) ? "/images/robot-".RKConstants::RESOURCE_PASSED.".png" : "/images/robot-".RKConstants::RESOURCE_QUIZ.".png";
                        break;

                }

                $thisBook = $book;
            }
        }

        if ($_SESSION['score_earned']['assignment_complete']) {
            $_SESSION['studentInfo']['booklist'] = null;
        }

        return $thisBook;
    }

    public function updateCustomCompletedAssignmentsStatus() {
        if($_SESSION['studentInfo']['booklist']['customCompletedAssignments']) {
            foreach($_SESSION['studentInfo']['booklist']['customCompletedAssignments'] as &$customCompletedAssignment) {
                foreach($customCompletedAssignment['resources'] as &$resource) {
                    if($resource['read']) {
                        $resource['read']['class-status'] = "activityIconContainer-perfect";
                    }
                    if($resource['listen']) {
                        $resource['listen']['class-status'] = "activityIconContainer-perfect";
                    }
                    if($resource['quiz']) {
                        if($resource['quiz']['class-status'] != "activityIconContainer-perfect") {
                            $resource['quiz']['class-status'] = "activityIconContainer-perfect";
                        }
                        $resource['quiz']['href'] = "/main/Activity/id/".$resource['delivery']['quiz']['resource_deployment_id'];
                        unset($resource['quiz']['class-disabled']);
                        $resource['delivery']['quiz']['active'] = "true";
                    }
                    if ($resource['worksheet']) {
                        if($resource['worksheet']['class-status'] != "activityIconContainer-perfect") {
                            $resource['worksheet']['class-status'] = "activityIconContainer-perfect";
                        }
                    }
                }
            }
        }
    }

    public function getListenStarsEarned($book) {
        $listenStarsEarned = 0;
        //$featureCheck = new FeatureCheck();
        if ($book['listen_earned']['firstTime']) {
            $listenStarsEarned = (($book['listen_completed'] == "true" && $_SESSION['score_earned']['listen']) ? RKConstants::STARS_FIRST_TIME_LISTEN : 0);
        }
        /*if ($featureCheck->isFeatureEnabled("DOUBLE_STAR_BOOKS") && $_SESSION['studentInfo']['additionalStarsEarned'] != 0){
            $listenStarsEarned = $_SESSION['score_earned']['listen'] + $_SESSION['studentInfo']['additionalStarsEarned'];
        }*/
        if ($_SESSION['score_earned']['listen'] && $_SESSION['score_earned']['assignment_complete']) {
            $listenStarsEarned = $_SESSION['score_earned']['listen'] + $_SESSION['score_earned']['assignment_complete'];
        }
        return $listenStarsEarned;
    }

    public function getReadStarsEarned($book) {
        $readStarsEarned = 0;
        //$featureCheck = new FeatureCheck();
        if ($book['read_earned']['firstTime']) {
            $readStarsEarned = (($book['reading_completed'] == "true" && $_SESSION['score_earned']['read']) ? RKConstants::STARS_FIRST_TIME_READ : 0);
        } else {
            $readStarsEarned = $_SESSION['score_earned']['read'];
        }
        /*if ($featureCheck->isFeatureEnabled("DOUBLE_STAR_BOOKS") && $_SESSION['studentInfo']['additionalStarsEarned'] != 0){
            $readStarsEarned = $_SESSION['score_earned']['read'] + $_SESSION['studentInfo']['additionalStarsEarned'];
        }*/
        if ($_SESSION['score_earned']['read'] && $_SESSION['score_earned']['assignment_complete']) {
            $readStarsEarned = $_SESSION['score_earned']['read'] + $_SESSION['score_earned']['assignment_complete'];
        }
        return $readStarsEarned;
    }

    public function getRecordingStarsEarned() {
        $recordingStarsEarned = 0;
        if (is_numeric($_SESSION['score_earned']['record'])) {
            $recordingStarsEarned += $_SESSION['score_earned']['record'];
        }
        return $recordingStarsEarned;
    }

    public function getQuizStarsEarned() {
        $quizStarsEarned = 0;
        $featureCheck = new FeatureCheck();

        if (isset($_SESSION['score_earned']['quiz_pass'])) {
            $quizStarsEarned += $_SESSION['score_earned']['quiz_pass'];
        } else if (isset($_SESSION['score_earned']['quiz_perfect'])) {
            $quizStarsEarned += $_SESSION['score_earned']['quiz_perfect'];
        }

        if ($_SESSION['score_earned']['assignment_complete']) {
            $quizStarsEarned += $_SESSION['score_earned']['assignment_complete'];
        }

        /*if ($featureCheck->isFeatureEnabled("DOUBLE_STAR_BOOKS") && $_SESSION['studentInfo']['double_star_activity_completed']){
            $quizStarsEarned = $_SESSION['score_earned']['quiz'] + $_SESSION['studentInfo']['additionalStarsEarned'];
        }*/
        return $quizStarsEarned;
    }

    public function getWatchStarsEarned($book) {
        $watchStarsEarned = 0;
        if ($book['watch_earned']['firstTime']) {
            $watchStarsEarned = (($book['watch_completed'] == "true" && $_SESSION['score_earned']['watch']) ? RKConstants::STARS_FIRST_TIME_WATCH : 0);
        }
        if ($_SESSION['score_earned']['watch'] && $_SESSION['score_earned']['assignment_complete']) {
            $watchStarsEarned = $_SESSION['score_earned']['watch'] + $_SESSION['score_earned']['assignment_complete'];
        }
        return $watchStarsEarned;
    }

    public function getWordGameStarsEarned($book) {
        $wordGameStarsEarned = 0;
        //FIXME: Assign into 'score_earned' somewhere
        //Maybe this is where we should determine whether the value stored matches actual performance according to the bookmark? Is the bookmark cleared at this point?
        if (isset($_SESSION['score_earned']['word_game'])) {
            $wordGameStarsEarned += $_SESSION['score_earned']['word_game'];
            unset($_SESSION['score_earned']['word_game']);
        }
        return $wordGameStarsEarned;
    }

    public function getWorksheetStarsEarned() {
        $worksheetStarsEarned = 0;

        switch (true) {
            case isset($_SESSION['score_earned']['worksheet_perfect']):
                $worksheetStarsEarned += $_SESSION['score_earned']['worksheet_perfect'];
                break;
            case isset($_SESSION['score_earned']['worksheet_pass']):
                $worksheetStarsEarned += $_SESSION['score_earned']['worksheet_pass'];
                break;
            default:
                $worksheetStarsEarned += $_SESSION['score_earned']['worksheet_failed'];
                break;
        }

        if ($_SESSION['score_earned']['assignment_complete']) {
            $worksheetStarsEarned += $_SESSION['score_earned']['worksheet'] + $_SESSION['score_earned']['assignment_complete'];
        }

        return $worksheetStarsEarned;
    }

    public function getVocabGameStarsEarned() {
        $vocabGameStarsEarned = 0;

        switch (true) {
            case isset($_SESSION['score_earned']['vsc_game_practice']):
                $vocabGameStarsEarned += $_SESSION['score_earned']['vsc_game_practice'];
                break;
            case isset($_SESSION['score_earned']['vsc_game_assessment_perfect']):
                $vocabGameStarsEarned += $_SESSION['score_earned']['vsc_game_assessment_perfect'];
                break;
            case isset($_SESSION['score_earned']['vsc_game_assessment_pass']):
                $vocabGameStarsEarned += $_SESSION['score_earned']['vsc_game_assessment_pass'];
                break;
            case isset($_SESSION['score_earned']['vsc_game_assessment_failed']):
                $vocabGameStarsEarned += $_SESSION['score_earned']['vsc_game_assessment_failed'];
                break;
        }

        if ($_SESSION['score_earned']['assignment_complete']) {
            $gameStarsEarned = isset($_SESSION['score_earned']['vsc_game_practice']) ? $_SESSION['score_earned']['vsc_game_practice'] : $_SESSION['score_earned']['vsc_game_assessment'];
            $vocabGameStarsEarned += $gameStarsEarned + $_SESSION['score_earned']['assignment_complete'];
        }

        return $vocabGameStarsEarned;
    }

    public function getWorksheetCompleteAudioSource() {
        $cdnService = new CdnService();
        $cdn = $cdnService->getCdn();

        switch (true) {
            case is_numeric($_SESSION['score_earned']['worksheet_perfect']):
                $audioPath = '/worksheet_resources/global/interactivity_allattempts_end_perfect.mp3';
                break;
            case is_numeric($_SESSION['score_earned']['worksheet_pass']):
                $audioPath = '/worksheet_resources/global/interactivity_end_passing.mp3';
                break;
            default:
                $audioPath = '/worksheet_resources/global/interactivity_end_fail_noread.mp3';
                break;
        }

        return $cdn->domainName . $audioPath;
    }

    public function getVocabularyActivityCompleteAudioSource($book) {
        $cdnService = new CdnService();
        $cdn = $cdnService->getCdn();

        switch (true) {
            case is_numeric($_SESSION['score_earned']['vsc_game_assessment_perfect']):
                $audioPath = '/vocabulary_audio_feedback/v_quiz_end_perfect.mp3';
                break;
            case is_numeric($_SESSION['score_earned']['vsc_game_assessment_pass']):
                $audioPath = '/vocabulary_audio_feedback/v_quiz_end_passing.mp3';
                break;
            case is_numeric($_SESSION['score_earned']['vsc_game_assessment_failed']):
                $audioPath = !$book['delivery']['vsc_game_assessment']['is_locked'] ? '/vocabulary_audio_feedback/v_quiz_fail1.mp3' : '/vocabulary_audio_feedback/v_quiz_fail2.mp3';
                break;
            case is_numeric($_SESSION['score_earned']['vsc_game_practice']):
                $audioPath = '/vocabulary_audio_feedback/v_interactivity_completed.mp3';
                break;
            default:
                $audioPath = '/vocabulary_audio_feedback/v_interactivity_completed.mp3';
                break;
        }

        return $cdn->domainName . $audioPath;
    }

    public function enableTimedReadError($readStarsEarned, $wasRead) {
        $featureCheck = new FeatureCheck();
        $isTimedRead = true;
        if ($featureCheck->isFeatureEnabled('DISABLE_TIMED_READ')) {
            $isTimedRead = false;
        }

        $enableTimedReadError = false;
        if ($_SESSION['studentInfo']['activityInfo']['activityType'] == "read" && ($isTimedRead == true) && !isset($wasRead) && ($readStarsEarned == 0)) {
            $enableTimedReadError = true;
        }
        return $enableTimedReadError;
    }

    public function isFavorite($kidsBookId) {
        $favoriteCacheService = new FavoriteSessionCacheService(
            $this->getShardConfigurationId(),
            StudentInfoCache::getReadingAccountId()
        );
        return $favoriteCacheService->isFavorite($kidsBookId);
    }

    public function canFavoriteResource() {
        return
            StudentInfoCache::isFavoritesEnabled() &&
            $_SESSION['studentInfo']['activityInfo']['subject_name'] == 'reading' &&
            !$this->isRecordingOnlyOrMatchingAssessment() &&
            !isset($_SESSION['score_earned']['assignment_complete']) &&
            in_array(
                $_SESSION['studentInfo']['activityInfo']['application_area'],
                [
                    RKConstants::APPLICATION_AREA_ASSIGNMENT,
                    RKConstants::APPLICATION_AREA_BOOKROOM,
                    RKConstants::APPLICATION_AREA_AD_HOC
                ]
            );
    }

    public function getAdditionalStarsEarned(){
        if (FeatureCheck::hasFeatureEnabled("DOUBLE_STAR_BOOKS")) {
            return $_SESSION['studentInfo']['additionalStarsEarned'];
        }
        else{
            return 0;
        }
    }

    private function fetchBookByResourceDeploymentId($resourceDeploymentId) {
        $service = new RKService();
        $cdnService = new CdnService();
        $cdn = $cdnService->getCdn();
        return $service->getKidsBook($resourceDeploymentId, null, null, $cdn->domainName);
    }

    private function fetchResources($resourceDeploymentId) {
        $bookList = &$this->getFlattenedResources($_SESSION['studentInfo']['booklist']);
        if(empty($bookList)) {
            $service = new RKService();
            $cdnService = new CdnService();
            $cdn = $cdnService->getCdn();
            $book = $service->getKidsBook($resourceDeploymentId, null, null, $cdn->domainName);
            $bookList = array($book);
        }
        return $bookList;
    }
/* ------------------------------------------------------------------------------ FEATURE CODE ----------------------------------------------------------------------------- */
    public function getHeadsproutStarsEarned() {
        return RKConstants::HEADSPROUT_STARS_EPISODE_COMPLETION;
    }
/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
}
