'use strict'

var tweets_container = document.querySelector(".tweets-line");
var file_input_field = document.getElementById('tweet-file-input');

var username = "";
function submitNreset(o) {
    var input_field = document.querySelector("#username");
    if (o.textContent == "OK") {
        username = input_field.value;
        input_field.readOnly = true;
        input_field.style.backgroundColor = "#eeeeee";
        o.textContent = "Reset";
    } else if (o.textContent == "Reset") {
        username = "";
        input_field.value = "";
        file_input_field.value = "";
        input_field.readOnly = false;
        input_field.style.backgroundColor = "#fcfcfc";
        o.textContent = "OK";
        tweets_container.textContent = "";
    }
}

file_input_field.addEventListener('change', function(event) {
        var file = event.target.files[0];
        if (username == "") {
            alert("Set your username first!");
            file_input_field.value = "";
        } else {
            tweets_container.textContent = "";
            tweet_input(file);
        }
    });

function tweet_input(file) {
    var reader = new FileReader();
    reader.addEventListener('load', function() {
        var tweets = JSON.parse(this.result.substr(25));
        deal_with_tweet(tweets);
    });
    reader.readAsText(file);
}

function review_n_scroll(object) {
    // review
    // at first I thought about a review card triggered by hover,
    //      now I think it is unnecessary and scrolling is enough.

    // scroll
    object.addEventListener("click", function() {
        var scroll_id = this.textContent.trim();
        var scroll_element = document.querySelector("#id" + scroll_id);
        scroll_element.scrollIntoView({behavior:"smooth"});
        scroll_element.style.backgroundColor = "#fdedec";
        setTimeout(function() {
            scroll_element.style.backgroundColor = "#eafaf1";
            scroll_element.style.transition = "background-color 2s";
        }, 2000);
        setTimeout(function() {scroll_element.style = null;}, 2000);
    });
}

function deal_with_tweet(tweets) {
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
    var template = document.querySelector("#tweet-card");
    var offset = new Date().getTimezoneOffset();

    var thread_pair = {};    // key:origin string  &&  value:replys list

    tweets.forEach(function(i) {
        var clone = template.content.cloneNode(true);
        var card = clone.querySelector(".tweet");
        var reply_to = clone.querySelector(".reply-to");
        var datetime = clone.querySelector(".datetime");
        var t_id = clone.querySelector(".t-id");
        var full_text = clone.querySelector(".full-text");
        var tweet = i["tweet"];

        // id of the div
        card.id = "id" + tweet["id"];

        // id to display
        t_id.textContent = tweet["id"];

        // reply_to to display
        if ("in_reply_to_status_id" in tweet && tweet["in_reply_to_screen_name"] == username){
            let reply_to_symbol = document.createTextNode("⤴️ ");
            reply_to.appendChild(reply_to_symbol);
            let new_span = document.createElement("span");
            new_span.textContent = tweet["in_reply_to_status_id"];
            reply_to.appendChild(new_span);
            review_n_scroll(new_span);
            if (tweet["in_reply_to_status_id"] in thread_pair) {
                thread_pair[tweet["in_reply_to_status_id"]].push(tweet["id"]);
            } else {
                thread_pair[tweet["in_reply_to_status_id"]] = [tweet["id"]];
            }
        }

        // datetime to display
        var ori_time = tweet["created_at"];
        var timeInMillis = Date.parse(ori_time);
        var correctTime = new Date(timeInMillis - offset * 60 * 1000);
        var correct_datetime = correctTime.toISOString();
        datetime.textContent = correct_datetime.substr(0, 16).replace('T', ' ');

        // full text to display
        var ft = tweet["full_text"];
        // deal with media link
        if ("extended_entities" in tweet && "media" in tweet["extended_entities"]){
            var media = tweet["extended_entities"]["media"];
            for (var i = 0; i < media.length; i++) {
                var m_url = "<a href='" + media[i]["media_url"] + "'>Media Link</a>"
                ft = ft.replace(media[i]["url"], m_url);
            }
        }
        // replace the urls
        if ("entities" in tweet && "urls" in tweet["entities"]){
            var urls = tweet["entities"]["urls"];
            for (var i = 0; i < urls.length; i++) {
                var u_url = "<a href='" + urls[i]["expanded_url"] + "'>" + decodeURI(urls[i]["expanded_url"]) + "</a>"
                ft = ft.replace(urls[i]["url"], u_url);
            }
        }
        // format hashtags
        if ("entities" in tweet && "hashtags" in tweet["entities"]){
            var hashtags = tweet["entities"]["hashtags"];
            for (var i = 0; i < hashtags.length; i++) {
                var h_url = "<a href='https://twitter.com/hashtag/" + hashtags[i]["text"] + "'>#" + hashtags[i]["text"] + "</a>"
                ft = ft.replace("#" + hashtags[i]["text"], h_url);
            }
        }
        // format user mentions
        if ("entities" in tweet && "user_mentions" in tweet["entities"]){
            var user_mentions = tweet["entities"]["user_mentions"];
            for (var i = 0; i < user_mentions.length; i++) {
                var um_url = "<a href='https://twitter.com/" + user_mentions[i]["screen_name"] + "'>@" + user_mentions[i]["name"] + "</a>"
                ft = ft.replace("@" + user_mentions[i]["screen_name"], um_url);
            }
        }
        full_text.innerHTML = ft;

        tweets_container.appendChild(clone);
    })

    // deal with thread_pair, i.e. add ping-back in “replyed” field
    for (const [key, value] of Object.entries(thread_pair)) {
        var origin_tweet = document.querySelector("#id" + key);
        if (origin_tweet) {
            var reply_place = origin_tweet.querySelector(".replyed");
            let reply_symbol = document.createTextNode("↩️ ");
            reply_place.appendChild(reply_symbol);
            for (var i = 0; i < value.length; i++) {
                let new_span = document.createElement("span");
                new_span.innerHTML = value[i] + "&emsp;";
                reply_place.appendChild(new_span);
                review_n_scroll(new_span);
            }
        } else {
            // goto tweet cards of the id in value and break them
            // console.log(key);
            // console.log(value);
            for (var i = 0; i < value.length; i++) {
                var break_tweet = document.querySelector("#id" + value[i]);
                var reply_to_place = break_tweet.querySelector(".reply-to");
                reply_to_place.textContent = reply_to_place.textContent + " (broken)";
            }
        }
    }

    // list.js
    var options = {
        valueNames: ["t-id", "full-text"],
        item: "tweet-card",
        listClass: "tweets-line",
        searchClass: "search-tweet",
        searchColumns: ["full-text"],
        searchDelay: 500,
        sortClass: "sort-tweet",
    };
    var tweetList = new List("tweets-line-container", options)
}


