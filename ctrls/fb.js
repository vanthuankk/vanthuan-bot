const got = require('got');
const JSONB = require('json-bigint');

// Các hàm và module chính c gi nguyên nh ban u...

async function StoriesBucketQuery(bucketID, storyID) {
    const resData = await Utils.postWithToken(
        'https://graph.facebook.com/graphql',
        {
            fb_api_caller_class: 'RelayModern',
            fb_api_req_friendly_name: 'StoriesSuspenseContentPaneRootWithEntryPointQuery',
            doc_id: '7114359461936746',
            variables: JSON.stringify({ bucketID: bucketID, blur: 10, cursor: null, scale: 1 })
        },
    ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);
    return AttachmentFormatter.stories((resData?.data || resData?.[0].data), storyID);
}

async function FetchStoriesAndMedia(url) {
    try {
        if (storiesRegex.test(url))
            return StoriesBucketQuery(storiesRegex.exec(url)[1], storiesRegex.exec(url)[2]);
        if (!urlRegex.test(url))
            return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'The URL you entered is not valid.' };
        if (profileRegex.test(url))
            return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'The URL you entered is not valid.' };

        let resData = await Utils.postWithToken(
            'https://graph.facebook.com/graphql',
            {
                fb_api_req_friendly_name: 'ComposerLinkPreviewQuery',
                client_doc_id: '89598650511870084207501691272',
                variables: JSON.stringify({
                    params: {
                        url: url
                    }
                })
            },
        ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);
        if (!resData || resData.error || resData.errors) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };

        if (onlyVideoRegex.test(url) || onlyVideoRegex.test(decodeURIComponent(resData?.data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.storyUrl)) || IGUrlRegex.test(decodeURIComponent(resData?.data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.storyUrl)))
            return AttachmentFormatter.previewMedia(resData.data);

        const share_params = Utils.parseFromJSONB(resData?.data?.link_preview?.share_scrape_data).share_params;
        if (share_params && storiesRegex.test(share_params?.urlInfo?.canonical))
            return StoriesBucketQuery(storiesRegex.exec(share_params?.urlInfo?.canonical)[1], storiesRegex.exec(share_params?.urlInfo?.canonical)[2]);

        if (!resData?.data?.link_preview?.story?.id) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };

        const post_id = share_params[0]?.toString();
        const node_id = resData?.data?.link_preview?.story?.id;

        resData = await Utils.postWithToken(
            'https://graph.facebook.com/graphql',
            {
                fb_api_req_friendly_name: 'FetchGraphQLStoryAndMediaFromTokenQuery',
                client_doc_id: '14968485422525517963281561600',
                variables: JSON.stringify({
                    action_location: "feed",
                    node_id: node_id,
                }),
                fb_api_caller_class: 'graphservice'
            },
        ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);

        if (!resData || resData.error || resData.errors) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };

        if (!resData?.data?.mediaset?.media?.edges || resData?.data?.mediaset?.media?.edges.length == 0) {
            resData = await Utils.postWithToken(
                'https://graph.facebook.com/graphql',
                {
                    fb_api_req_friendly_name: 'CometSinglePostContentQuery',
                    doc_id: 8362454010438212,
                    variables: JSON.stringify({ storyID: node_id })
                },
            ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);

            if (!resData || resData.error || resData.errors) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
            return AttachmentFormatter.webMedia(resData.data.node.comet_sections.content.story);
        }

        return AttachmentFormatter.mobileMedia(resData?.data);
    } catch (error) {
        console.error(error);
        return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: error?.response || error.message };
    }
}

module.exports = {
    cfg: {
        path: '/fb', // Endpoint chính cho API
        author: 'teams [] niiozic', // Tác gi hoc i phát trin
    },
    StoriesBucketQuery,
    FetchStoriesAndMedia,
    // Các hàm và module khác gi nguyên nh ban u...
};
