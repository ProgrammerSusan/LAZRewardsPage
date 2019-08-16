<?php
namespace LAZ\objects\modules\razkids\StudentPortal;

use LAZ\objects\base\Controller;
use LAZ\objects\kidsaz\businessObjects\assignment\TestAssignment;
use LAZ\objects\kidsaz\caches\StudentReadingCache;
use LAZ\objects\kidsaz\caches\StudentScienceCache;
use LAZ\objects\kidsaz\services\ActivityRollupCacheService;
use LAZ\objects\kidsaz\services\assignment\SelfPacedAssignmentCacheService;
use LAZ\objects\kidsaz\services\ClassroomConfigService;
use LAZ\objects\kidsaz\services\QuickStatsService;
use LAZ\objects\library\RKStudentHelpers;
use LAZ\objects\library\SubscriptionHelper;
use LAZ\objects\razkids\RKConstants;
use LAZ\objects\razkids\StudentInfoCache;
use LAZ\objects\modules\razkids\WritingKidsRoom\KidsWritingRoomBookCollections;
use LAZ\objects\kidsaz\services\assignment\TestAssignmentService;
use LAZ\objects\razkids\TeacherInfoCache;
use LAZ\objects\tools\FeatureCheck;

class StudentPortal extends Controller
{
    /**
     * @var StudentPortalModel
     */
    public $model;

    public function __construct() {
        parent::__construct();
    }

    public function setStudentAssignmentsContext() {
/* ------------------------------------------------------------------------------ FEATURE CODE ----------------------------------------------------------------------------- */		
        //If feature deployed remove if block, otherwise move code within block back to (if isIntermediateInterfaceEnabled())
        $featureCheck = new FeatureCheck();
        if (FeatureCheck::hasFeatureEnabled("REWARDS_PAGE_INTERN_PROJECT") || StudentInfoCache::isIntermediateInterfaceEnabled()){
            $shard = TeacherInfoCache::getShardConfigurationId();
            $headerData = $studentHelpers->getHeaderData($studentId);
            $selfPacedAssignmentCacheService = new SelfPacedAssignmentCacheService($shard);
            $activityRollupCacheService = new ActivityRollupCacheService($shard);
            $quickStatsService = new QuickStatsService($shard, $activityRollupCacheService);
            $quickStatsByActivityType = $quickStatsService->getQuickStatsByActivityType(StudentInfoCache::getStudentAccountIds(), StudentInfoCache::getClassroomId()); //stores totals within session, if deployed move to quickStatsData view
        }
/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
        if (StudentInfoCache::isIntermediateInterfaceEnabled()) {
            $this->view->assign('selfPacedData', $selfPacedAssignmentCacheService->getProgressInfo(StudentInfoCache::getReadingAccountId(), StudentReadingCache::getSelfPacedAssignment()));
            $this->view->assign('quickStatsData', $quickStatsService->getQuickStatsByActivityType(StudentInfoCache::getStudentAccountIds(), StudentInfoCache::getClassroomId()));
            $this->view->assign("content", 'intermediate/student_intermediate_main');
        } else {
            if (!FeatureCheck::hasFeatureEnabled("REWARDS_PAGE_INTERN_PROJECT")){
                $headerData = $studentHelpers->getBasicHeaderData($studentId);
            }
            if ($hasStandAloneRazKidsSubscription || $hasRazKidsSubscriptionAndLicenseOnly) {
                $this->redirect('/main/ReadingStudent');
            } else if ($hasStandAloneSproutSubscription || $hasHeadsproutSubscriptionAndLicenseOnly) {
                $this->redirect('/main/HeadSproutStudent');
            } else if ($hasStandAloneWritingSubscription || $hasWritingSubscriptionAndLicenseOnly) {
                $this->redirect('/main/WritingStudent');
            } else if ($hasStandAloneScienceSubscription || $hasScienceSubscriptionAndLicenseOnly) {
                $this->redirect('/main/ScienceStudent');
            } else if ($this->isFeatureEnabled('VAZ_STUDENT') && ($hasStandAloneVocabSubscription || $hasVocabSubscriptionAndLicenseOnly)) {
                // Always show portal for vocab regardless if they have an assignment or not (show grayed out product)
                $this->view->assign("content", 'StudentPortal');
            }
            else {
                $this->view->assign("content", 'StudentPortal');
            }
        }

        $this->view->assign("headerData", $headerData);

        return ($this->view);
    }

}