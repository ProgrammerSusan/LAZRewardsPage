<?
namespace LAZ\objects\razkids;

use LAZ\objects\kidsaz\businessObjects\assignment\PhonicsAssignment;
use LAZ\objects\kidsaz\businessObjects\assignment\ScienceAssignment;
use LAZ\objects\kidsaz\businessObjects\assignment\StudentCustomAssignment;
use LAZ\objects\kidsaz\businessObjects\assignment\TestAssignment;
use LAZ\objects\kidsaz\services\ClassroomConfigService;
use LAZ\objects\library\PHPUtil;
use LAZ\objects\library\SiteHelper;
use LAZ\objects\library\FormHelpers;
use LAZ\objects\library\RKHelper;
use LAZ\objects\library\RKStudentHelpers;
use LAZ\objects\library\SubjectHelpers;
use LAZ\objects\science\businessObjects\ScienceLevel;
use LAZ\objects\tools\FeatureCheck;
use LAZ\objects\kidsaz\businessObjects\StudentResourceDeliveryConfig;
use LAZ\objects\kidsaz\services\bookroom\RecentService;
use LAZ\objects\library\SubscriptionHelper;
use LAZ\objects\modules\razkids\abstracted\StudentAbstractModel;

class StudentInfoCache {
    const SELF_PACED_ASSIGNMENT = 'assignments';

    static function getStudentInfo() {
        return !empty($_SESSION['studentInfo']) ? $_SESSION['studentInfo'] : null;
    }

    static function cacheStudentInfo($studentInfo) {
        return $_SESSION['studentInfo'] = $studentInfo;
    }
	
	static function isLicensedForReading() {
        return self::isLicensedForSite(SiteHelper::RK_SITE_ABBREVIATION);
    }

    public static function setActivityTypeTotalsBySubjectId(array $activityTypeTotals) {
        $_SESSION['studentInfo']['activityTypeTotalsBySubjectId'] = $activityTypeTotals;
    }

    public static function getActivityTypeTotalsBySubjectId() {
        return $_SESSION['studentInfo']['activityTypeTotalsBySubjectId'];
    }

    public static function setBooklist( $booklist){
        $_SESSION['studentInfo']['booklist'] = $booklist;
    }

    public static function getBooklist(){
        $studentInfo = self::getStudentInfo();
        return $studentInfo['booklist'];
    }


    public static function getFlattenedBooklist() {
        $booklist = self::getBooklist();
        $studentAbstractModel = new StudentAbstractModel();
        $flattened = $studentAbstractModel->getFlattenedResources( $booklist);
        return $flattened;
    }

    public static function getQuizCompletionStatusForKidsBookId( $kidsBookId) {
        $booklist = self::getFlattenedBooklist();

        foreach( $booklist as $book){
            if( $book['kids_book_id'] == $kidsBookId){
                return $book['delivery']['quiz']['completion_status'];
            }
        }
        return null;
    }
/* ------------------------------------------------------------------------------ FEATURE CODE ----------------------------------------------------------------------------- */
    public static function getScoreEarned() {
        return !empty($_SESSION['score_earned']) ? $_SESSION['score_earned'] : null;
    }

    public static function unsetShowLevelup(){
        unset($_SESSION['studentInfo']['activityInfo']['isPartOfLevelUp']);
    }
/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
}
