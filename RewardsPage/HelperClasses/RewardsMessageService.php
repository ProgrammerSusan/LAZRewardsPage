<?php
/* ------------------------------------------------------------------------------ FEATURE CODE ----------------------------------------------------------------------------- */
namespace LAZ\objects\modules\razkids\ActivityReward;

class RewardsMessageService {
    public static function perfectMessage(){
     $message = array("Awesome!",
                "Good Job!",
                "Wow!",
                "Well Done!",
                "Exceptional!"
            );
     $randomMessageIndex = array_rand($message, 1);
     return $message[$randomMessageIndex];
    }

    public static function imperfectMessage(){
        $message = array("Almost There!",
                    "Close!",
                    "Keep Going!",
                    "Try Again!",
                    "Nice Try"
                );
        $randomMessageIndex = array_rand($message, 1);
        return $message[$randomMessageIndex];
    }
}