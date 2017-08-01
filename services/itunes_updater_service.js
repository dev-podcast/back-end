

    "use strict";

    class ItunesPodcastUpdater {
            constructor() {
                this._podcasts = new Array();
                this._currentpodcast = null;
            }

            get podcasts() {
                return this._podcasts;
            }

            set podcasts(podcasts) {
               this._podcasts = podcasts;
            } 


            static update() {

            }

            
    }





    module.exports = ItunesPodcastUpdater;

/*     class ItunesEpisodeUpdater {
         constructor() {

         }

         static update() {

         }
    }


 */