<?php
namespace LAZ\objects\modules\razkids\RecordStudentQuizCompletion;

use LAZ\objects\library\ActivityTypeHelper;
use LAZ\objects\razkids\StudentInfoCache;
use LAZ\objects\shared\services\ResourceDeliveryService;

class NextBookRecommendationService {

    static function nextBookRecommendation($applicationArea){
        $studentInfo = StudentInfoCache::getStudentInfo();
        if($applicationArea === 'bookroom'){
            $bookList = $studentInfo['resourceDeliveryStatusCache'];
            $config = StudentInfoCache::getReadingResourceDeliveryConfig();
            return self::findNextReadingRoomBook($bookList, $config);
        }
        else{
            $bookList = StudentInfoCache::getBooklist();
            return self::findNextBook($bookList);
        }
    }

    static private function findNextBook($bookList) {
        foreach($bookList as $book => $subBookList){
            foreach($subBookList as $bookProperties => $activityStatus){
                $incompleteActivityType = self::getDeliveryStatusFromDeliveryArray($activityStatus['delivery']);
                if(self::isValidDeliveryStatus($incompleteActivityType)){
                    return array('title' => $activityStatus['title'], 'href' => $activityStatus[$incompleteActivityType]['href']);
                }
            }
        }
        return array('title' => "You've completed all the books!", 'href' => null);
    }

    static private function getDeliveryStatusFromDeliveryArray($delivery){
        foreach($delivery as $deliveryStatus){
            if($deliveryStatus['completion_status'] === "false"){
                return ActivityTypeHelper::getActivityTypeNameById($deliveryStatus['activity_type_id']);
            }
        }
        return null;
    }

    static private function isValidDeliveryStatus($incompleteActivityType){
        return $incompleteActivityType != null && $incompleteActivityType != 'interactive_lesson';
    }

    /**
     * @param $bookList
     * @return mixed
     */
    static private function findNextReadingRoomBook($bookList, $config) {
        foreach($bookList as $resourceId => $delivery){
            foreach($delivery as $activityTypeId => $deliveryStatus) {
                if(!$deliveryStatus->isCompleted){
                    $resourceDeliveryStatus = ResourceDeliveryService::getResourcesWithDeliveries([$resourceId], $config->licenseTypeId, $config->applicationAreaId);
                    $title = $resourceDeliveryStatus[$resourceId]->title;
                    $href = $resourceDeliveryStatus[$resourceId]->deliveries[$activityTypeId]->resourceDeploymentId;
                    return array('title' => $title, 'href' => "/main/Activity/id/".$href);
                }
            }
        }
        return array('title' => "Try another category!", 'href' => null);
    }

}