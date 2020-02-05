'use strict';

var Zap = {
    new_action_pre_custom_action_fields: function(bundle) {
         console.log('pre-custom-action-fields');
      console.log(bundle.action_fields.eventid);
      if( bundle.action_fields.eventid) {
          return bundle.request;
      }
      else {
         throw new StopRequestException('Event has not been set yet.');
        }
    }
};
