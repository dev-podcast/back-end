
//Mapped out the incoming structure from AudioSearch's API. 
var AudioSearchPodcast = {
    id: null, 
    title: null, 
    network: null, 
    status: null, 
    categories: [{
        parent_id: null, 
        name: null, 
        id: null
    }], 
    description: null, 
    number_of_episodes: null, 
    image_files: [{
        url: null
    }], 
    sc_feed: null, 
    web_profiles: null, 
    episode_ids: [{}], 
    urls: {},
    recent_episodes:[{
        file_name: null, 
        item_name: null, 
        item_id: null, 
        file_status: null
    }],
    buzz_score: null

}

module.exports = AudioSearchPodcast;