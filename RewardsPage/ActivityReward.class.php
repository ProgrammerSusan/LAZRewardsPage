<?php

namespace LAZ\objects\modules\razkids\ActivityReward;

use LAZ\objects\kidsaz\caches\StudentReadingCache;
use LAZ\objects\kidsaz\services\assignment\SelfPacedAssignmentCacheService;
use LAZ\objects\library\ActivityTypeHelper;
use LAZ\objects\modules\razkids\abstracted\StudentAbstractController;
use LAZ\objects\razkids\RKConstants;
use LAZ\objects\razkids\StudentInfoCache;
use LAZ\objects\tools\FeatureCheck;

class ActivityReward extends StudentAbstractController {
    /**
     * @var ActivityRewardModel
     */
    public $model;

/* ------------------------------------------------------------------------------ FEATURE CODE ----------------------------------------------------------------------------- */
    public function processRequest() {
        if (FeatureCheck::hasFeatureEnabled("REWARDS_PAGE_INTERN_PROJECT")) {
            $resourceDeploymentId = $_GET['id'];
            $studentInfo = StudentInfoCache::getStudentInfo();
            $scoreEarned = StudentInfoCache::getScoreEarned();
            if ($this->model->isValidRequest($resourceDeploymentId)) {
                $backLinkInfo = $this->model->getBackLinkInfo();

                $this->model->updateCustomCompletedAssignmentsStatus();
                $thisBook = $this->model->updateBookStatus($resourceDeploymentId);

                if(array_key_exists('Episode', $_GET) && $_GET['Episode'] < 5) {
                    $studentInfo['activityInfo']['activityType'] = 'headsprout';
                    $scoreEarned['headsprout_episode_complete'] = RKConstants::HEADSPROUT_STARS_EPISODE_COMPLETION;
                }
                $this->view->assign("siteTrackingGenerator", $this->getStudentSiteTrackingGenerator());

                $contentVars = array("reward" => array("stars" => $this->getStars($studentInfo, $scoreEarned),
                                                        "message" => RewardsMessageService::perfectMessage()),
                    "rewardHeader" => array("title" => $thisBook['title'],
                        "location" => $backLinkInfo['location'],
                        "linkText" => $backLinkInfo['linkText'],
                        "favoriteData" => $this->favoriteButtonData($thisBook)),
                    "levelUpInfo" => array("showLevelUpProgress" => $this->getShowLevelUpProgress($studentInfo),
                        "tasksRemaining" => $this->returnLevelUpTasksRemaining()),
                    "activityTotal" => $this->getActivityTotal(),
                    "deliveryInfo" => $this->getDeliveryInformation($thisBook));

                $this->view->assign("activityRewardContent", $contentVars);

                $this->display('ActivityReward');
            } else {
                $this->redirect($this->model->getContextUrl());
            }
        }
/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------ ORIGINAL CODE ------------------------------------------------------------------------------------- */
        else {
            $resourceDeploymentId = $_GET['id'];
            if ($this->model->isValidRequest($resourceDeploymentId)) {
                $backLinkInfo = $this->model->getBackLinkInfo();

                $this->view->assign("location", $backLinkInfo['location']);
                $this->view->assign("linkText", $backLinkInfo['linkText']);
                $this->view->assign("activityType", $this->model->getActivityType());
                $this->view->assign("sizeAvailable", "large");
                $this->view->assign("orientation", $this->model->getOrientation());
                $this->view->assign("isRecordingOnlyOrMatchingAssessment",
                    $this->model->isRecordingOnlyOrMatchingAssessment());
                $this->view->assign("activityId", $_SESSION['studentInfo']['activityInfo']['resourceDeploymentId']);

                $this->model->updateCustomCompletedAssignmentsStatus();
                $thisBook = $this->model->updateBookStatus($resourceDeploymentId);

                if (isset($thisBook)) {
                    $this->view->assign("book", $thisBook);
                    if ($this->model->canFavoriteResource() && is_numeric($thisBook['kids_book_id'])) {
                        $this->view->assign('canFavoriteResource', true);
                        $this->view->assign('isFavorite', $this->model->isFavorite($thisBook['kids_book_id']));
                    } else {
                        $this->view->assign('canFavoriteResource', false);
                        $this->view->assign('isFavorite', false);
                    }
                }

                if(array_key_exists('Episode', $_GET) && $_GET['Episode'] < 5) {
                    $_SESSION['studentInfo']['activityInfo']['activityType'] = 'headsprout';
                    $_SESSION['score_earned']['headsprout_episode_complete'] = RKConstants::HEADSPROUT_STARS_EPISODE_COMPLETION;
                    $this->view->assign('headsproutStarsEarned', $this->model->getHeadsproutStarsEarned());
                }
                $featureCheck = new FeatureCheck();
                $readStarsEarned = $this->model->getReadStarsEarned($thisBook);
                $this->view->assign("listenStarsEarned", $this->model->getListenStarsEarned($thisBook));
                $this->view->assign("readStarsEarned", $readStarsEarned);
                $this->view->assign("recordingStarsEarned", $this->model->getRecordingStarsEarned());
                $this->view->assign("quizStarsEarned", $this->model->getQuizStarsEarned());
                $this->view->assign("watchStarsEarned", $this->model->getWatchStarsEarned($thisBook));
                $this->view->assign("wordGameStarsEarned", $this->model->getWordGameStarsEarned($thisBook));
                $this->view->assign("worksheetStarsEarned", $this->model->getWorksheetStarsEarned());
                $this->view->assign("vocabGameStarsEarned", $this->model->getVocabGameStarsEarned());
                $this->view->assign('worksheetCompleteAudioSource', $this->model->getWorksheetCompleteAudioSource());
                $this->view->assign('vocabularyActivityCompleteAudioSource', $this->model->getVocabularyActivityCompleteAudioSource($thisBook));

                if ($featureCheck->isFeatureEnabled("DOUBLE_STAR_BOOKS")) {
                    $this->view->assign("additionalStarsEarned", $this->model->getAdditionalStarsEarned());
                }

                $this->view->assign("enableTimedReadError",
                    $this->model->enableTimedReadError($readStarsEarned, $thisBook['read']['class-status']));
                $this->view->assign("isStudentBadgesEnabled", $this->isFeatureEnabled("STUDENT_BADGES"));
                $this->view->assign("isVocabGamesEnabled", $this->isFeatureEnabled('VAZ_STUDENT'));
                $this->view->assign("allowReturnHome", true);
                $this->view->assign("siteTrackingGenerator", $this->getStudentSiteTrackingGenerator());

                $this->display('ActivityReward');
            } else {
                $this->redirect($this->model->getContextUrl());
            }
        }
    }
/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------ FEATURE CODE -------------------------------------------------------------------------------- */
    private function isEarlyHeadsproutEpisode(){
        return array_key_exists('Episode', $_GET) && $_GET['Episode'] < 5;
    }

    private function canFavorite($thisBook){
        return $this->model->canFavoriteResource() && is_numeric($thisBook['kids_book_id']);
    }

    private function favoriteButtonData($thisBook){
        if ($this->model->canFavoriteResource() && is_numeric($thisBook['kids_book_id'])) {
            return array("canFavoriteResource" => true,
                        "isFavorite" => $this->model->isFavorite($thisBook['kids_book_id']),
                        "bookId" => $thisBook['kids_book_id']);
        } else {
            return array("canFavoriteResource" => false,
                "isFavorite" => false,
                "bookId" => $thisBook['kids_book_id']);
        }
    }

    private function getStars($studentInfo, $scoreEarned) {
        if($this->isEarlyHeadsproutEpisode()){
            return RKConstants::HEADSPROUT_STARS_EPISODE_COMPLETION;
        }
        $stars = $scoreEarned[$studentInfo['activityInfo']['activityType']] + $this->model->getAdditionalStarsEarned();
        return $stars;
    }

    private function getShowLevelUpProgress($studentInfo) {
            $isLevelUp = false;
            if ($studentInfo['activityInfo']['isPartOfLevelUp']) {
                $isLevelUp = true;
                StudentInfoCache::unsetShowLevelUp();
            }
            return $isLevelUp;
    }

    private function getActivityTotal() {
        if(FeatureCheck::hasFeatureEnabled("REWARDS_PAGE_INTERN_PROJECT")){
            if($this->isEarlyHeadsproutEpisode()){
                //Activity counts do not apply to early reading headsprout episodes, returning 0 so activity total does not show up in angular component
                return 0;
            }
            $studentInfo = StudentInfoCache::getStudentInfo();
            $subjectId = $studentInfo['activityInfo']['subject_id'];
            $activityType = $studentInfo['activityInfo']['activityType'];
            $activityTypeId = ActivityTypeHelper::getActivityTypeIdByName($activityType);
            return $studentInfo['activityTypeTotalsBySubjectId'][$subjectId][$activityTypeId];
        }
        else{
            return null;
        }
    }

    private function returnLevelUpTasksRemaining() {
        $selfPacedAssignmentCacheService = new SelfPacedAssignmentCacheService($this->getShardConfigurationId());
        $progressData = $selfPacedAssignmentCacheService->getProgressInfo(StudentInfoCache::getReadingAccountId(),
            StudentReadingCache::getSelfPacedAssignment());
        return $progressData['remainingTasks'];
    }

    public function getDeliveryInformation($book) {
        $delivery = $book['delivery'];
        $activityTypes = $this->sortDeliveryKeys(array_keys($delivery));
        $deliveryResourceHrefs = $this->getDeliveryResourceHref($delivery, $activityTypes);
        $deliveryStatus = $this->getDeliveryStatus($activityTypes, $book);
        $deliveryBookmark = $this->getDeliveryBookmark($activityTypes, $book);
        $deliveryInformation = $this->combineDeliveryAttributes($deliveryResourceHrefs, $deliveryStatus, $deliveryBookmark, $activityTypes);
        return $deliveryInformation;
    }

    private function sortDeliveryKeys($activityType){
        $activityTypeDisplayOrder = ['listen', 'read', 'quiz', 'worksheet', 'watch', 'interactive_lesson', 'vsc_game_practice', 'vsc_game_assessment'];
        $result = [];
        foreach($activityTypeDisplayOrder as $activity){
            if(in_array($activity, $activityType)){
                array_push($result, $activity);
            }
        }
        return $result;
    }

    private function getDeliveryResourceHref($delivery, $activityTypes) {
        $resourceIds = [];
        foreach ($activityTypes as $activity) {
            array_push($resourceIds, "/main/Activity/id/" . $delivery[$activity]['resource_deployment_id']);
        }
        return $resourceIds;
    }

    private function getDeliveryStatus($activityTypes, $book) {
        $deliveryStatus = [];
        foreach ($activityTypes as $activityName) {
            array_push($deliveryStatus, $book[$activityName]['class-status']);
        }
        return $deliveryStatus;
    }

    private function getDeliveryBookmark($activityTypes, $book) {
        $deliveryBookmark = [];
        foreach ($activityTypes as $activityName) {
            array_push($deliveryBookmark, $book[$activityName]['class-bookmark']);
        }
        return $deliveryBookmark;
    }

    private function combineDeliveryAttributes($deliveryResourceHrefs, $deliveryStatus, $deliveryBookmark, $activityTypes){
        $deliveryInformation = [];
        foreach ($activityTypes as $index => $activity) {
            $result = [];
            $result['href'] = $deliveryResourceHrefs[$index];
            $result['status'] = $deliveryStatus[$index];
            $result['bookmark'] = $deliveryBookmark[$index];
            $deliveryInformation[$activity] = $result;
        }
        return $deliveryInformation;
    }
/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
}