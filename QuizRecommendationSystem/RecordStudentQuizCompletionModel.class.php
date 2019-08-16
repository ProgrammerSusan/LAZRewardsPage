<?php
namespace LAZ\objects\modules\razkids\RecordStudentQuizCompletion;

use LAZ\objects\library\RKService;
use LAZ\objects\modules\razkids\abstracted\RecordStudentActivityCompletionAbstractModel;
use LAZ\objects\razkids\RKConstants;
use LAZ\objects\tools\FeatureCheck;

class RecordStudentQuizCompletionModel extends RecordStudentActivityCompletionAbstractModel {
	
	function record_quiz_completion($resource_deployment_id, $application_area, $student_assignment_id, $assignment_added_at, $recording_type, $quiz_completion_request, $platform_id, $studentAssignmentRequestParam) {
	    if (!is_numeric($resource_deployment_id)) {
	        return null;
	    }
	    
		$service = new RKService();
		$studentAccountId = $this->getStudentAccountIdByResourceDeploymentId($resource_deployment_id);
		
		$result = $service->recordActivityCompletion($resource_deployment_id,
                                                        $studentAccountId,
                                                        $this->getShardConfigurationId(),
                                                        $platform_id,
                                                        array('assignment_added_at' => $assignment_added_at,
                                                             'student_assignment_id' => $student_assignment_id,
				                                         	 'application_area' => $application_area,
                                                             'quiz_result' => $quiz_completion_request,
                                                             'recording_type' => $recording_type,
                                                             'first_time_pass_perfectly' => RKConstants::STARS_FIRST_TIME_QUIZ_PASS_100_PERCENT,
                                                             'first_time_pass_not_perfectly' => RKConstants::STARS_FIRST_TIME_QUIZ_PASS_80_PERCENT,
                                                             'first_time_from_pass_to_perfect' => RKConstants::STARS_QUIZ_FROM_PASS_TO_PERFECT,
                                                             'running_record' => RKConstants::STARS_ASSESSMENT,
                                                             'student_assignment_request_param' => $studentAssignmentRequestParam,
                                                             'prevent_quiz_lock' => !$this->hasSiblingReadOrListenActivity($resource_deployment_id)
                                                        ));

        if ($result != null) {
            if ($result['assignment_completion_stars'] == 0 && $_SESSION['score_earned']['assignment_complete'] > 0) {
                $result['assignment_completion_stars'] = $_SESSION['score_earned']['assignment_complete'];
            }
            $result['application_area'] =  $application_area;
            $this->setActivityComplete($resource_deployment_id, $result);
        }

        if(FeatureCheck::hasFeatureEnabled("REWARDS_PAGE_INTERN_PROJECT")){
            if($result['is_passed']){
                $result['recommendation'] = NextBookRecommendationService::nextBookRecommendation($result['application_area']);
            }
        }

        return $result;
    }

    private function hasSiblingReadOrListenActivity($resourceDeploymentId){
        $bookList = $this->getFlattenedResources($_SESSION['studentInfo']['booklist']);
        foreach($bookList as $book){
            $activities = $book['delivery'];
            foreach($activities as $type => $activity){
                if($activity['resource_deployment_id'] == $resourceDeploymentId){
                    return array_key_exists('read', $activities) || array_key_exists('listen', $activities);
                }
            }
        }
        return false;
    }
}
