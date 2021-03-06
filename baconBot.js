/**
 *Copyright 2015 BaconBot (clone of bscBot)
 *Modifications (including forks) of the code to fit personal needs are allowed only for personal use and should refer back to the original source.
 *This software is not for profit, any extension, or unauthorised person providing this software is not authorised to be in a position of any monetary gain from this use of this software. Any and all money gained under the use of the software (which includes donations) must be passed on to the original author.
 */


(function () {

    /*window.onerror = function() {
        var room = JSON.parse(localStorage.getItem("baconBotRoom"));
        window.location = 'https://plug.dj' + room.name;
    };*/

    API.getWaitListPosition = function(id){
        if(typeof id === 'undefined' || id === null){
            id = API.getUser().id;
        }
        var wl = API.getWaitList();
        for(var i = 0; i < wl.length; i++){
            if(wl[i].id === id){
                return i;
            }
        }
        return -1;
    };

    var kill = function () {
        clearInterval(baconBot.room.autodisableInterval);
        clearInterval(baconBot.room.afkInterval);
        baconBot.status = false;
    };

    var storeToStorage = function () {
        localStorage.setItem("baconBotsettings", JSON.stringify(baconBot.settings));
        localStorage.setItem("baconBotRoom", JSON.stringify(baconBot.room));
        var baconBotStorageInfo = {
            time: Date.now(),
            stored: true,
            version: baconBot.version
        };
        localStorage.setItem("baconBotStorageInfo", JSON.stringify(baconBotStorageInfo));

    };

    var subChat = function (chat, obj) {
        if (typeof chat === "undefined") {
            API.chatLog("There is a chat text missing.");
            console.log("There is a chat text missing.");
            return "[Error] No text message found.";

            // TODO: Get missing chat messages from source.
        }
        var lit = '%%';
        for (var prop in obj) {
            chat = chat.replace(lit + prop.toUpperCase() + lit, obj[prop]);
        }
        return chat;
    };

    var loadChat = function (cb) {
        if (!cb) cb = function () {
        };
        $.get("https://rawgit.com/BaconGirl/Baconbot/master/lang/langIndex.json", function (json) {
            var link = baconBot.chatLink;
            if (json !== null && typeof json !== "undefined") {
                langIndex = json;
                link = langIndex[baconBot.settings.language.toLowerCase()];
                if (baconBot.settings.chatLink !== baconBot.chatLink) {
                    link = baconBot.settings.chatLink;
                }
                else {
                    if (typeof link === "undefined") {
                        link = baconBot.chatLink;
                    }
                }
                $.get(link, function (json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        baconBot.chat = json;
                        cb();
                    }
                });
            }
            else {
                $.get(baconBot.chatLink, function (json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        baconBot.chat = json;
                        cb();
                    }
                });
            }
        });
    };

    var retrieveSettings = function () {
        var settings = JSON.parse(localStorage.getItem("baconBotsettings"));
        if (settings !== null) {
            for (var prop in settings) {
                baconBot.settings[prop] = settings[prop];
            }
        }
    };

    var retrieveFromStorage = function () {
        var info = localStorage.getItem("baconBotStorageInfo");
        if (info === null) API.chatLog(baconBot.chat.nodatafound);
        else {
            var settings = JSON.parse(localStorage.getItem("baconBotsettings"));
            var room = JSON.parse(localStorage.getItem("baconBotRoom"));
            var elapsed = Date.now() - JSON.parse(info).time;
            if ((elapsed < 1 * 60 * 60 * 1000)) {
                API.chatLog(baconBot.chat.retrievingdata);
                for (var prop in settings) {
                    baconBot.settings[prop] = settings[prop];
                }
                baconBot.room.users = room.users;
                baconBot.room.afkList = room.afkList;
                baconBot.room.historyList = room.historyList;
                baconBot.room.mutedUsers = room.mutedUsers;
                //baconBot.room.autoskip = room.autoskip;
                baconBot.room.roomstats = room.roomstats;
                baconBot.room.messages = room.messages;
                baconBot.room.queue = room.queue;
                baconBot.room.newBlacklisted = room.newBlacklisted;
                API.chatLog(baconBot.chat.datarestored);
            }
        }
        var json_sett = null;
        var roominfo = document.getElementById("room-settings");
        info = roominfo.textContent;
        var ref_bot = "@baconBot=";
        var ind_ref = info.indexOf(ref_bot);
        if (ind_ref > 0) {
            var link = info.substring(ind_ref + ref_bot.length, info.length);
            var ind_space = null;
            if (link.indexOf(" ") < link.indexOf("\n")) ind_space = link.indexOf(" ");
            else ind_space = link.indexOf("\n");
            link = link.substring(0, ind_space);
            $.get(link, function (json) {
                if (json !== null && typeof json !== "undefined") {
                    json_sett = JSON.parse(json);
                    for (var prop in json_sett) {
                        baconBot.settings[prop] = json_sett[prop];
                    }
                }
            });
        }

    };

    String.prototype.splitBetween = function (a, b) {
        var self = this;
        self = this.split(a);
        for (var i = 0; i < self.length; i++) {
            self[i] = self[i].split(b);
        }
        var arr = [];
        for (var i = 0; i < self.length; i++) {
            if (Array.isArray(self[i])) {
                for (var j = 0; j < self[i].length; j++) {
                    arr.push(self[i][j]);
                }
            }
            else arr.push(self[i]);
        }
        return arr;
    };

    String.prototype.startsWith = function(str) {
      return this.substring(0, str.length) === str;
    };

    function linkFixer(msg) {
        var parts = msg.splitBetween('<a href="', '<\/a>');
        for (var i = 1; i < parts.length; i = i + 2) {
            var link = parts[i].split('"')[0];
            parts[i] = link;
        }
        var m = '';
        for (var i = 0; i < parts.length; i++) {
            m += parts[i];
        }
        return m;
    };

    function decodeEntities(s) {
        var str, temp = document.createElement('p');
        temp.innerHTML = s;
        str = temp.textContent || temp.innerText;
        temp = null;
        return str;
    };

    var botCreator = "The Basic Team";
    var botMaintainer = "BaconGirl / AleBles / Davpat "
    var botCreatorIDs = ["6439812", "6440073"];

    var baconBot = {
        version: "2.8.14",
        status: false,
        name: "baconBot",
        loggedInID: null,
        scriptLink: "https://rawgit.com/BaconGirl/Baconbot/master/baconBot.js",
        cmdLink: "http://git.io/vZ3fO",
        chatLink: "https://rawgit.com/BaconGirl/Baconbot/master/lang/en.json",
        chat: null,
        loadChat: loadChat,
        retrieveSettings: retrieveSettings,
        retrieveFromStorage: retrieveFromStorage,
        settings: {
            botName: "baconBot",
            language: "english",
            chatLink: "https://rawgit.com/BaconGirl/Baconbot/master/lang/en.json",
            scriptLink: "https://rawgit.com/BaconGirl/Baconbot/master/baconBot.js",
            roomLock: false, // Requires an extension to re-load the script
            startupCap: 1, // 1-200
            startupVolume: 0, // 0-100
            startupEmoji: false, // true or false
            autowoot: true,
            autoskip: false,
            smartSkip: true,
            cmdDeletion: true,
            maximumAfk: 120,
            afkRemoval: false,
            maximumDc: 60,
            bouncerPlus: true,
            blacklistEnabled: true,
            lockdownEnabled: false,
            lockGuard: false,
            maximumLocktime: 10,
            cycleGuard: true,
            maximumCycletime: 10,
            voteSkip: true,
            voteSkipLimit: 4,
            historySkip: true,
            timeGuard: true,
            maximumSongLength: 8,
            autodisable: true,
            commandCooldown: 30,
            usercommandsEnabled: true,
            skipPosition: 3,
            skipReasons: [
                ["meh", "The son you choose is too long or has too many mehs. "],
                ["genre", "This song has wrong genre for the community. "],
                ["op", "This song is in the overplayed list. "],
                ["history", "This song was already played recently . "],
                ["mix", "You played a mix, which is against the rules. "],
                ["sound", "The song you played had bad sound quality or no sound. "],
                ["nsfw", "The song you wanted to play was NSFW (image or sound), offensive or innapropiate. "],
                ["unavailable", "The song you played was not available for some users or does not play. "]
            ],
            afkpositionCheck: 15,
            afkRankCheck: "ambassador",
            motdEnabled: false,
            motdInterval: 10,
            motd: "Remember to check the BACON RULES on the description of the community.",
            filterChat: true,
            etaRestriction: false,
            welcome: true,
            opLink: null,
            rulesLink: null,
            themeLink: null,
            fbLink: null,
            youtubeLink: null,
            website: null,
            intervalMessages: [],
            messageInterval: 5,
            songstats: false,
            commandLiteral: "!",
            blacklists: {
                NSFW: "https://rawgit.com/BaconGirl/custom/master/blacklists/NSFWlist.json",
                OP: "https://rawgit.com/BaconGirl/custom/master/blacklists/OPlist.json",
                BANNED: "https://rawgit.com/BaconGirl/custom/master/blacklists/BANNEDlist.json"
            }
        },
        room: {
            name: null,
            chatMessages: [],
            users: [],
            afkList: [],
            mutedUsers: [],
            bannedUsers: [],
            skippable: true,
            usercommand: true,
            allcommand: true,
            afkInterval: null,
            //autoskip: false,
            autoskipTimer: null,
            autodisableInterval: null,
            autodisableFunc: function () {
                if (baconBot.status && baconBot.settings.autodisable) {
                    API.sendChat('!afkdisable');
                    API.sendChat('!joindisable');
                }
            },
            queueing: 0,
            queueable: true,
            currentDJID: null,
            historyList: [],
            cycleTimer: setTimeout(function () {
            }, 1),
            roomstats: {
                accountName: null,
                totalWoots: 0,
                totalCurates: 0,
                totalMehs: 0,
                launchTime: null,
                songCount: 0,
                chatmessages: 0
            },
            messages: {
                from: [],
                to: [],
                message: []
            },
            queue: {
                id: [],
                position: []
            },
            blacklists: {

            },
            newBlacklisted: [],
            newBlacklistedSongFunction: null,
            roulette: {
                rouletteStatus: false,
                participants: [],
                countdown: null,
                startRoulette: function () {
                    baconBot.room.roulette.rouletteStatus = true;
                    baconBot.room.roulette.countdown = setTimeout(function () {
                        baconBot.room.roulette.endRoulette();
                    }, 60 * 1000);
                    API.sendChat(baconBot.chat.isopen);
                },
                endRoulette: function () {
                    baconBot.room.roulette.rouletteStatus = false;
                    var ind = Math.floor(Math.random() * baconBot.room.roulette.participants.length);
                    var winner = baconBot.room.roulette.participants[ind];
                    baconBot.room.roulette.participants = [];
                    var pos = Math.floor((Math.random() * API.getWaitList().length) + 1);
                    var user = baconBot.userUtilities.lookupUser(winner);
                    var name = user.username;
                    API.sendChat(subChat(baconBot.chat.winnerpicked, {name: name, position: pos}));
                    setTimeout(function (winner, pos) {
                        baconBot.userUtilities.moveUser(winner, pos, false);
                    }, 1 * 1000, winner, pos);
                }
            }
        },
        User: function (id, name) {
            this.id = id;
            this.username = name;
            this.jointime = Date.now();
            this.lastActivity = Date.now();
            this.votes = {
                woot: 0,
                meh: 0,
                curate: 0
            };
            this.lastEta = null;
            this.afkWarningCount = 0;
            this.afkCountdown = null;
            this.inRoom = true;
            this.isMuted = false;
            this.lastDC = {
                time: null,
                position: null,
                songCount: 0
            };
            this.lastKnownPosition = null;
        },
        userUtilities: {
            getJointime: function (user) {
                return user.jointime;
            },
            getUser: function (user) {
                return API.getUser(user.id);
            },
            updatePosition: function (user, newPos) {
                user.lastKnownPosition = newPos;
            },
            updateDC: function (user) {
                user.lastDC.time = Date.now();
                user.lastDC.position = user.lastKnownPosition;
                user.lastDC.songCount = baconBot.room.roomstats.songCount;
            },
            setLastActivity: function (user) {
                user.lastActivity = Date.now();
                user.afkWarningCount = 0;
                clearTimeout(user.afkCountdown);
            },
            getLastActivity: function (user) {
                return user.lastActivity;
            },
            getWarningCount: function (user) {
                return user.afkWarningCount;
            },
            setWarningCount: function (user, value) {
                user.afkWarningCount = value;
            },
            lookupUser: function (id) {
                for (var i = 0; i < baconBot.room.users.length; i++) {
                    if (baconBot.room.users[i].id === id) {
                        return baconBot.room.users[i];
                    }
                }
                return false;
            },
            lookupUserName: function (name) {
                for (var i = 0; i < baconBot.room.users.length; i++) {
                    var match = baconBot.room.users[i].username.trim() == name.trim();
                    if (match) {
                        return baconBot.room.users[i];
                    }
                }
                return false;
            },
            voteRatio: function (id) {
                var user = baconBot.userUtilities.lookupUser(id);
                var votes = user.votes;
                if (votes.meh === 0) votes.ratio = 1;
                else votes.ratio = (votes.woot / votes.meh).toFixed(2);
                return votes;

            },
            getPermission: function (obj) { //1 requests
                var u;
                if (typeof obj === "object") u = obj;
                else u = API.getUser(obj);
                for (var i = 0; i < botCreatorIDs.length; i++) {
                    if (botCreatorIDs[i].indexOf(u.id) > -1) return 10;
                }
                if (u.gRole < 2) return u.role;
                else {
                    switch (u.gRole) {
                        case 2:
                            return 7;
                        case 3:
                            return 8;
                        case 4:
                            return 9;
                        case 5:
                            return 10;
                    }
                }
                return 0;
            },
            moveUser: function (id, pos, priority) {
                var user = baconBot.userUtilities.lookupUser(id);
                var wlist = API.getWaitList();
                if (API.getWaitListPosition(id) === -1) {
                    if (wlist.length < 50) {
                        API.moderateAddDJ(id);
                        if (pos !== 0) setTimeout(function (id, pos) {
                            API.moderateMoveDJ(id, pos);
                        }, 1250, id, pos);
                    }
                    else {
                        var alreadyQueued = -1;
                        for (var i = 0; i < baconBot.room.queue.id.length; i++) {
                            if (baconBot.room.queue.id[i] === id) alreadyQueued = i;
                        }
                        if (alreadyQueued !== -1) {
                            baconBot.room.queue.position[alreadyQueued] = pos;
                            return API.sendChat(subChat(baconBot.chat.alreadyadding, {position: baconBot.room.queue.position[alreadyQueued]}));
                        }
                        baconBot.roomUtilities.booth.lockBooth();
                        if (priority) {
                            baconBot.room.queue.id.unshift(id);
                            baconBot.room.queue.position.unshift(pos);
                        }
                        else {
                            baconBot.room.queue.id.push(id);
                            baconBot.room.queue.position.push(pos);
                        }
                        var name = user.username;
                        return API.sendChat(subChat(baconBot.chat.adding, {name: name, position: baconBot.room.queue.position.length}));
                    }
                }
                else API.moderateMoveDJ(id, pos);
            },
            dclookup: function (id) {
                var user = baconBot.userUtilities.lookupUser(id);
                if (typeof user === 'boolean') return baconBot.chat.usernotfound;
                var name = user.username;
                if (user.lastDC.time === null) return subChat(baconBot.chat.notdisconnected, {name: name});
                var dc = user.lastDC.time;
                var pos = user.lastDC.position;
                if (pos === null) return baconBot.chat.noposition;
                var timeDc = Date.now() - dc;
                var validDC = false;
                if (baconBot.settings.maximumDc * 60 * 1000 > timeDc) {
                    validDC = true;
                }
                var time = baconBot.roomUtilities.msToStr(timeDc);
                if (!validDC) return (subChat(baconBot.chat.toolongago, {name: baconBot.userUtilities.getUser(user).username, time: time}));
                var songsPassed = baconBot.room.roomstats.songCount - user.lastDC.songCount;
                var afksRemoved = 0;
                var afkList = baconBot.room.afkList;
                for (var i = 0; i < afkList.length; i++) {
                    var timeAfk = afkList[i][1];
                    var posAfk = afkList[i][2];
                    if (dc < timeAfk && posAfk < pos) {
                        afksRemoved++;
                    }
                }
                var newPosition = user.lastDC.position - songsPassed - afksRemoved;
                if (newPosition <= 0) return subChat(baconBot.chat.notdisconnected, {name: name});
                var msg = subChat(baconBot.chat.valid, {name: baconBot.userUtilities.getUser(user).username, time: time, position: newPosition});
                baconBot.userUtilities.moveUser(user.id, newPosition, true);
                return msg;
            }
        },

        roomUtilities: {
            rankToNumber: function (rankString) {
                var rankInt = null;
                switch (rankString) {
                    case "admin":
                        rankInt = 10;
                        break;
                    case "ambassador":
                        rankInt = 7;
                        break;
                    case "host":
                        rankInt = 5;
                        break;
                    case "cohost":
                        rankInt = 4;
                        break;
                    case "manager":
                        rankInt = 3;
                        break;
                    case "bouncer":
                        rankInt = 2;
                        break;
                    case "residentdj":
                        rankInt = 1;
                        break;
                    case "user":
                        rankInt = 0;
                        break;
                }
                return rankInt;
            },
            msToStr: function (msTime) {
                var ms, msg, timeAway;
                msg = '';
                timeAway = {
                    'days': 0,
                    'hours': 0,
                    'minutes': 0,
                    'seconds': 0
                };
                ms = {
                    'day': 24 * 60 * 60 * 1000,
                    'hour': 60 * 60 * 1000,
                    'minute': 60 * 1000,
                    'second': 1000
                };
                if (msTime > ms.day) {
                    timeAway.days = Math.floor(msTime / ms.day);
                    msTime = msTime % ms.day;
                }
                if (msTime > ms.hour) {
                    timeAway.hours = Math.floor(msTime / ms.hour);
                    msTime = msTime % ms.hour;
                }
                if (msTime > ms.minute) {
                    timeAway.minutes = Math.floor(msTime / ms.minute);
                    msTime = msTime % ms.minute;
                }
                if (msTime > ms.second) {
                    timeAway.seconds = Math.floor(msTime / ms.second);
                }
                if (timeAway.days !== 0) {
                    msg += timeAway.days.toString() + 'd';
                }
                if (timeAway.hours !== 0) {
                    msg += timeAway.hours.toString() + 'h';
                }
                if (timeAway.minutes !== 0) {
                    msg += timeAway.minutes.toString() + 'm';
                }
                if (timeAway.minutes < 1 && timeAway.hours < 1 && timeAway.days < 1) {
                    msg += timeAway.seconds.toString() + 's';
                }
                if (msg !== '') {
                    return msg;
                } else {
                    return false;
                }
            },
            booth: {
                lockTimer: setTimeout(function () {
                }, 1000),
                locked: false,
                lockBooth: function () {
                    API.moderateLockWaitList(!baconBot.roomUtilities.booth.locked);
                    baconBot.roomUtilities.booth.locked = false;
                    if (baconBot.settings.lockGuard) {
                        baconBot.roomUtilities.booth.lockTimer = setTimeout(function () {
                            API.moderateLockWaitList(baconBot.roomUtilities.booth.locked);
                        }, baconBot.settings.maximumLocktime * 60 * 1000);
                    }
                },
                unlockBooth: function () {
                    API.moderateLockWaitList(baconBot.roomUtilities.booth.locked);
                    clearTimeout(baconBot.roomUtilities.booth.lockTimer);
                }
            },
            afkCheck: function () {
                if (!baconBot.status || !baconBot.settings.afkRemoval) return void (0);
                var rank = baconBot.roomUtilities.rankToNumber(baconBot.settings.afkRankCheck);
                var djlist = API.getWaitList();
                var lastPos = Math.min(djlist.length, baconBot.settings.afkpositionCheck);
                if (lastPos - 1 > djlist.length) return void (0);
                for (var i = 0; i < lastPos; i++) {
                    if (typeof djlist[i] !== 'undefined') {
                        var id = djlist[i].id;
                        var user = baconBot.userUtilities.lookupUser(id);
                        if (typeof user !== 'boolean') {
                            var plugUser = baconBot.userUtilities.getUser(user);
                            if (rank !== null && baconBot.userUtilities.getPermission(plugUser) <= rank) {
                                var name = plugUser.username;
                                var lastActive = baconBot.userUtilities.getLastActivity(user);
                                var inactivity = Date.now() - lastActive;
                                var time = baconBot.roomUtilities.msToStr(inactivity);
                                var warncount = user.afkWarningCount;
                                if (inactivity > baconBot.settings.maximumAfk * 60 * 1000) {
                                    if (warncount === 0) {
                                        API.sendChat(subChat(baconBot.chat.warning1, {name: name, time: time}));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function (userToChange) {
                                            userToChange.afkWarningCount = 1;
                                        }, 90 * 1000, user);
                                    }
                                    else if (warncount === 1) {
                                        API.sendChat(subChat(baconBot.chat.warning2, {name: name}));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function (userToChange) {
                                            userToChange.afkWarningCount = 2;
                                        }, 30 * 1000, user);
                                    }
                                    else if (warncount === 2) {
                                        var pos = API.getWaitListPosition(id);
                                        if (pos !== -1) {
                                            pos++;
                                            baconBot.room.afkList.push([id, Date.now(), pos]);
                                            user.lastDC = {

                                                time: null,
                                                position: null,
                                                songCount: 0
                                            };
                                            API.moderateRemoveDJ(id);
                                            API.sendChat(subChat(baconBot.chat.afkremove, {name: name, time: time, position: pos, maximumafk: baconBot.settings.maximumAfk}));
                                        }
                                        user.afkWarningCount = 0;
                                    }
                                }
                            }
                        }
                    }
                }
            },
            smartSkip: function (reason) {
                var dj = API.getDJ();
                var id = dj.id;
                var waitlistlength = API.getWaitList().length;
                var locked = false;
                baconBot.room.queueable = false;

                if (waitlistlength == 50) {
                    baconBot.roomUtilities.booth.lockBooth();
                    locked = true;
                }
                setTimeout(function (id) {
                    API.moderateForceSkip();
                    setTimeout(function () {
                        if (typeof reason !== 'undefined') {
                            API.sendChat(reason);
                        }
                    }, 500);
                    baconBot.room.skippable = false;
                    setTimeout(function () {
                        baconBot.room.skippable = true
                    }, 5 * 1000);
                    setTimeout(function (id) {
                        baconBot.userUtilities.moveUser(id, baconBot.settings.skipPosition, false);
                        baconBot.room.queueable = true;
                        if (locked) {
                            setTimeout(function () {
                                baconBot.roomUtilities.booth.unlockBooth();
                            }, 1000);
                        }
                    }, 1500, id);
                }, 1000, id);
            },
            changeDJCycle: function () {
                var toggle = $(".cycle-toggle");
                if (toggle.hasClass("disabled")) {
                    toggle.click();
                    if (baconBot.settings.cycleGuard) {
                        baconBot.room.cycleTimer = setTimeout(function () {
                            if (toggle.hasClass("enabled")) toggle.click();
                        }, baconBot.settings.cycleMaxTime * 60 * 1000);
                    }
                }
                else {
                    toggle.click();
                    clearTimeout(baconBot.room.cycleTimer);
                }

                // TODO: Use API.moderateDJCycle(true/false)
            },
            intervalMessage: function () {
                var interval;
                if (baconBot.settings.motdEnabled) interval = baconBot.settings.motdInterval;
                else interval = baconBot.settings.messageInterval;
                if ((baconBot.room.roomstats.songCount % interval) === 0 && baconBot.status) {
                    var msg;
                    if (baconBot.settings.motdEnabled) {
                        msg = baconBot.settings.motd;
                    }
                    else {
                        if (baconBot.settings.intervalMessages.length === 0) return void (0);
                        var messageNumber = baconBot.room.roomstats.songCount % baconBot.settings.intervalMessages.length;
                        msg = baconBot.settings.intervalMessages[messageNumber];
                    }
                    API.sendChat('/me ' + msg);
                }
            },
            updateBlacklists: function () {
                for (var bl in baconBot.settings.blacklists) {
                    baconBot.room.blacklists[bl] = [];
                    if (typeof baconBot.settings.blacklists[bl] === 'function') {
                        baconBot.room.blacklists[bl] = baconBot.settings.blacklists();
                    }
                    else if (typeof baconBot.settings.blacklists[bl] === 'string') {
                        if (baconBot.settings.blacklists[bl] === '') {
                            continue;
                        }
                        try {
                            (function (l) {
                                $.get(baconBot.settings.blacklists[l], function (data) {
                                    if (typeof data === 'string') {
                                        data = JSON.parse(data);
                                    }
                                    var list = [];
                                    for (var prop in data) {
                                        if (typeof data[prop].mid !== 'undefined') {
                                            list.push(data[prop].mid);
                                        }
                                    }
                                    baconBot.room.blacklists[l] = list;
                                })
                            })(bl);
                        }
                        catch (e) {
                            API.chatLog('Error setting' + bl + 'blacklist.');
                            console.log('Error setting' + bl + 'blacklist.');
                            console.log(e);
                        }
                    }
                }
            },
            logNewBlacklistedSongs: function () {
                if (typeof console.table !== 'undefined') {
                    console.table(baconBot.room.newBlacklisted);
                }
                else {
                    console.log(baconBot.room.newBlacklisted);
                }
            },
            exportNewBlacklistedSongs: function () {
                var list = {};
                for (var i = 0; i < baconBot.room.newBlacklisted.length; i++) {
                    var track = baconBot.room.newBlacklisted[i];
                    list[track.list] = [];
                    list[track.list].push({
                        title: track.title,
                        author: track.author,
                        mid: track.mid
                    });
                }
                return list;
            }
        },
        eventChat: function (chat) {
            chat.message = linkFixer(chat.message);
            chat.message = decodeEntities(chat.message);
            chat.message = chat.message.trim();

            baconBot.room.chatMessages.push([chat.cid, chat.message, chat.sub, chat.timestamp, chat.type, chat.uid, chat.un]);

            for (var i = 0; i < baconBot.room.users.length; i++) {
                if (baconBot.room.users[i].id === chat.uid) {
                    baconBot.userUtilities.setLastActivity(baconBot.room.users[i]);
                    if (baconBot.room.users[i].username !== chat.un) {
                        baconBot.room.users[i].username = chat.un;
                    }
                }
            }
            if (baconBot.chatUtilities.chatFilter(chat)) return void (0);
            if (!baconBot.chatUtilities.commandCheck(chat))
                baconBot.chatUtilities.action(chat);
        },
        eventUserjoin: function (user) {
            var known = false;
            var index = null;
            for (var i = 0; i < baconBot.room.users.length; i++) {
                if (baconBot.room.users[i].id === user.id) {
                    known = true;
                    index = i;
                }
            }
            var greet = true;
            var welcomeback = null;
            if (known) {
                baconBot.room.users[index].inRoom = true;
                var u = baconBot.userUtilities.lookupUser(user.id);
                var jt = u.jointime;
                var t = Date.now() - jt;
                if (t < 10 * 1000) greet = false;
                else welcomeback = true;
            }
            else {
                baconBot.room.users.push(new baconBot.User(user.id, user.username));
                welcomeback = false;
            }
            for (var j = 0; j < baconBot.room.users.length; j++) {
                if (baconBot.userUtilities.getUser(baconBot.room.users[j]).id === user.id) {
                    baconBot.userUtilities.setLastActivity(baconBot.room.users[j]);
                    baconBot.room.users[j].jointime = Date.now();
                }

            }
            if (baconBot.settings.welcome && greet) {
                welcomeback ?
                    setTimeout(function (user) {
                        API.sendChat(subChat(baconBot.chat.welcomeback, {name: user.username}));
                    }, 1 * 1000, user)
                    :
                    setTimeout(function (user) {
                        API.sendChat(subChat(baconBot.chat.welcome, {name: user.username}));
                    }, 1 * 1000, user);
            }
        },
        eventUserleave: function (user) {
            var lastDJ = API.getHistory()[0].user.id;
            for (var i = 0; i < baconBot.room.users.length; i++) {
                if (baconBot.room.users[i].id === user.id) {
                    baconBot.userUtilities.updateDC(baconBot.room.users[i]);
                    baconBot.room.users[i].inRoom = false;
                    if (lastDJ == user.id){
                        var user = baconBot.userUtilities.lookupUser(baconBot.room.users[i].id);
                        baconBot.userUtilities.updatePosition(user, 0);
                        user.lastDC.time = null;
                        user.lastDC.position = user.lastKnownPosition;
                    }
                }
            }
        },
        eventVoteupdate: function (obj) {
            for (var i = 0; i < baconBot.room.users.length; i++) {
                if (baconBot.room.users[i].id === obj.user.id) {
                    if (obj.vote === 1) {
                        baconBot.room.users[i].votes.woot++;
                    }
                    else {
                        baconBot.room.users[i].votes.meh++;
                    }
                }
            }

            var mehs = API.getScore().negative;
            var woots = API.getScore().positive;
            var dj = API.getDJ();
            var timeLeft = API.getTimeRemaining();
            var timeElapsed = API.getTimeElapsed();

            if (baconBot.settings.voteSkip) {
                if ((mehs - woots) >= (baconBot.settings.voteSkipLimit)) {
                    API.sendChat(subChat(baconBot.chat.voteskipexceededlimit, {name: dj.username, limit: baconBot.settings.voteSkipLimit}));
                    if (baconBot.settings.smartSkip && timeLeft > timeElapsed){
                        baconBot.roomUtilities.smartSkip();
                    }
                    else {
                        API.moderateForceSkip();
                    }
                }
            }

        },
        eventCurateupdate: function (obj) {
            for (var i = 0; i < baconBot.room.users.length; i++) {
                if (baconBot.room.users[i].id === obj.user.id) {
                    baconBot.room.users[i].votes.curate++;
                }
            }
        },
        eventDjadvance: function (obj) {
            if (baconBot.settings.autowoot) {
                $("#woot").click(); // autowoot
            }

            var user = baconBot.userUtilities.lookupUser(obj.dj.id)
            for(var i = 0; i < baconBot.room.users.length; i++){
                if(baconBot.room.users[i].id === user.id){
                    baconBot.room.users[i].lastDC = {
                        time: null,
                        position: null,
                        songCount: 0
                    };
                }
            }

            var lastplay = obj.lastPlay;
            if (typeof lastplay === 'undefined') return;
            if (baconBot.settings.songstats) {
                if (typeof baconBot.chat.songstatistics === "undefined") {
                    API.sendChat("/me " + lastplay.media.author + " - " + lastplay.media.title + ": " + lastplay.score.positive + "W/" + lastplay.score.grabs + "G/" + lastplay.score.negative + "M.")
                }
                else {
                    API.sendChat(subChat(baconBot.chat.songstatistics, {artist: lastplay.media.author, title: lastplay.media.title, woots: lastplay.score.positive, grabs: lastplay.score.grabs, mehs: lastplay.score.negative}))
                }
            }
            baconBot.room.roomstats.totalWoots += lastplay.score.positive;
            baconBot.room.roomstats.totalMehs += lastplay.score.negative;
            baconBot.room.roomstats.totalCurates += lastplay.score.grabs;
            baconBot.room.roomstats.songCount++;
            baconBot.roomUtilities.intervalMessage();
            baconBot.room.currentDJID = obj.dj.id;

            var blacklistSkip = setTimeout(function () {
                var mid = obj.media.format + ':' + obj.media.cid;
                for (var bl in baconBot.room.blacklists) {
                    if (baconBot.settings.blacklistEnabled) {
                        if (baconBot.room.blacklists[bl].indexOf(mid) > -1) {
                            API.sendChat(subChat(baconBot.chat.isblacklisted, {blacklist: bl}));
                            if (baconBot.settings.smartSkip){
                                return baconBot.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    }
                }
            }, 2000);
            var newMedia = obj.media;
            var timeLimitSkip = setTimeout(function () {
                if (baconBot.settings.timeGuard && newMedia.duration > baconBot.settings.maximumSongLength * 60 && !baconBot.room.roomevent) {
                    var name = obj.dj.username;
                    API.sendChat(subChat(baconBot.chat.timelimit, {name: name, maxlength: baconBot.settings.maximumSongLength}));
                    if (baconBot.settings.smartSkip){
                        return baconBot.roomUtilities.smartSkip();
                    }
                    else {
                        return API.moderateForceSkip();
                    }
                }
            }, 2000);
            var format = obj.media.format;
            var cid = obj.media.cid;
            var naSkip = setTimeout(function () {
                if (format == 1){
                    $.getJSON('https://www.googleapis.com/youtube/v3/videos?id=' + cid + '&key=AIzaSyDcfWu9cGaDnTjPKhg_dy9mUh6H7i4ePZ0&part=snippet&callback=?', function (track){
                        if (typeof(track.items[0]) === 'undefined'){
                            var name = obj.dj.username;
                            API.sendChat(subChat(baconBot.chat.notavailable, {name: name}));
                            if (baconBot.settings.smartSkip){
                                return baconBot.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    });
                }
                else {
                    var checkSong = SC.get('/tracks/' + cid, function (track){
                        if (typeof track.title === 'undefined'){
                            var name = obj.dj.username;
                            API.sendChat(subChat(baconBot.chat.notavailable, {name: name}));
                            if (baconBot.settings.smartSkip){
                                return baconBot.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    });
                }
            }, 2000);
            clearTimeout(historySkip);
            if (baconBot.settings.historySkip) {
                var alreadyPlayed = false;
                var apihistory = API.getHistory();
                var name = obj.dj.username;
                var historySkip = setTimeout(function () {
                    for (var i = 0; i < apihistory.length; i++) {
                        if (apihistory[i].media.cid === obj.media.cid) {
                            baconBot.room.historyList[i].push(+new Date());
                            alreadyPlayed = true;
                            API.sendChat(subChat(baconBot.chat.songknown, {name: name}));
                            if (baconBot.settings.smartSkip){
                                return baconBot.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    }
                    if (!alreadyPlayed) {
                        baconBot.room.historyList.push([obj.media.cid, +new Date()]);
                    }
                }, 2000);
            }
            if (user.ownSong) {
                API.sendChat(subChat(baconBot.chat.permissionownsong, {name: user.username}));
                user.ownSong = false;
            }
            clearTimeout(baconBot.room.autoskipTimer);
            if (baconBot.settings.autoskip) {
                var remaining = obj.media.duration * 1000;
                var startcid = API.getMedia().cid;
                baconBot.room.autoskipTimer = setTimeout(function() {
                    var endcid = API.getMedia().cid;
                    if (startcid === endcid) {
                        //API.sendChat('Song stuck, skipping...');
                        API.moderateForceSkip();
                    }
                }, remaining + 5000);
            }
            storeToStorage();
        },
        eventWaitlistupdate: function (users) {
            if (users.length < 50) {
                if (baconBot.room.queue.id.length > 0 && baconBot.room.queueable) {
                    baconBot.room.queueable = false;
                    setTimeout(function () {
                        baconBot.room.queueable = true;
                    }, 500);
                    baconBot.room.queueing++;
                    var id, pos;
                    setTimeout(
                        function () {
                            id = baconBot.room.queue.id.splice(0, 1)[0];
                            pos = baconBot.room.queue.position.splice(0, 1)[0];
                            API.moderateAddDJ(id, pos);
                            setTimeout(
                                function (id, pos) {
                                    API.moderateMoveDJ(id, pos);
                                    baconBot.room.queueing--;
                                    if (baconBot.room.queue.id.length === 0) setTimeout(function () {
                                        baconBot.roomUtilities.booth.unlockBooth();
                                    }, 1000);
                                }, 1000, id, pos);
                        }, 1000 + baconBot.room.queueing * 2500);
                }
            }
            for (var i = 0; i < users.length; i++) {
                var user = baconBot.userUtilities.lookupUser(users[i].id);
                baconBot.userUtilities.updatePosition(user, API.getWaitListPosition(users[i].id) + 1);
            }
        },
        chatcleaner: function (chat) {
            if (!baconBot.settings.filterChat) return false;
            if (baconBot.userUtilities.getPermission(chat.uid) > 1) return false;
            var msg = chat.message;
            var containsLetters = false;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === ':' || ch === '^') containsLetters = true;
            }
            if (msg === '') {
                return true;
            }
            if (!containsLetters && (msg.length === 1 || msg.length > 3)) return true;
            msg = msg.replace(/[ ,;.:\/=~+%^*\-\\"'&@#]/g, '');
            var capitals = 0;
            var ch;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if (ch >= 'A' && ch <= 'Z') capitals++;
            }
            if (capitals >= 40) {
                API.sendChat(subChat(baconBot.chat.caps, {name: chat.un}));
                return true;
            }
            msg = msg.toLowerCase();
            if (msg === 'skip') {
                API.sendChat(subChat(baconBot.chat.askskip, {name: chat.un}));
                return true;
            }
            for (var j = 0; j < baconBot.chatUtilities.spam.length; j++) {
                if (msg === baconBot.chatUtilities.spam[j]) {
                    API.sendChat(subChat(baconBot.chat.spam, {name: chat.un}));
                    return true;
                }
            }
            return false;
        },
        chatUtilities: {
            chatFilter: function (chat) {
                var msg = chat.message;
                var perm = baconBot.userUtilities.getPermission(chat.uid);
                var user = baconBot.userUtilities.lookupUser(chat.uid);
                var isMuted = false;
                for (var i = 0; i < baconBot.room.mutedUsers.length; i++) {
                    if (baconBot.room.mutedUsers[i] === chat.uid) isMuted = true;
                }
                if (isMuted) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (baconBot.settings.lockdownEnabled) {
                    if (perm === 0) {
                        API.moderateDeleteChat(chat.cid);
                        return true;
                    }
                }
                if (baconBot.chatcleaner(chat)) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (baconBot.settings.cmdDeletion && msg.startsWith(baconBot.settings.commandLiteral)) {
                    API.moderateDeleteChat(chat.cid);
                }
                /**
                 var plugRoomLinkPatt = /(\bhttps?:\/\/(www.)?plug\.dj[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                 if (plugRoomLinkPatt.exec(msg)) {
                    if (perm === 0) {
                        API.sendChat(subChat(baconBot.chat.roomadvertising, {name: chat.un}));
                        API.moderateDeleteChat(chat.cid);
                        return true;
                    }
                }
                 **/
                if (msg.indexOf('http://adf.ly/') > -1) {
                    API.moderateDeleteChat(chat.cid);
                    API.sendChat(subChat(baconBot.chat.adfly, {name: chat.un}));
                    return true;
                }
                if (msg.indexOf('autojoin was not enabled') > 0 || msg.indexOf('AFK message was not enabled') > 0 || msg.indexOf('!afkdisable') > 0 || msg.indexOf('!joindisable') > 0 || msg.indexOf('autojoin disabled') > 0 || msg.indexOf('AFK message disabled') > 0) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }

                var rlJoinChat = baconBot.chat.roulettejoin;
                var rlLeaveChat = baconBot.chat.rouletteleave;

                var joinedroulette = rlJoinChat.split('%%NAME%%');
                if (joinedroulette[1].length > joinedroulette[0].length) joinedroulette = joinedroulette[1];
                else joinedroulette = joinedroulette[0];

                var leftroulette = rlLeaveChat.split('%%NAME%%');
                if (leftroulette[1].length > leftroulette[0].length) leftroulette = leftroulette[1];
                else leftroulette = leftroulette[0];

                if ((msg.indexOf(joinedroulette) > -1 || msg.indexOf(leftroulette) > -1) && chat.uid === baconBot.loggedInID) {
                    setTimeout(function (id) {
                        API.moderateDeleteChat(id);
                    }, 5 * 1000, chat.cid);
                    return true;
                }
                return false;
            },
            commandCheck: function (chat) {
                var cmd;
                if (chat.message.charAt(0) === baconBot.settings.commandLiteral) {
                    var space = chat.message.indexOf(' ');
                    if (space === -1) {
                        cmd = chat.message;
                    }
                    else cmd = chat.message.substring(0, space);
                }
                else return false;
                var userPerm = baconBot.userUtilities.getPermission(chat.uid);
                //console.log("name: " + chat.un + ", perm: " + userPerm);
                if (chat.message !== baconBot.settings.commandLiteral + 'join' && chat.message !== baconBot.settings.commandLiteral + "leave") {
                    if (userPerm === 0 && !baconBot.room.usercommand) return void (0);
                    if (!baconBot.room.allcommand) return void (0);
                }
                if (chat.message === baconBot.settings.commandLiteral + 'eta' && baconBot.settings.etaRestriction) {
                    if (userPerm < 2) {
                        var u = baconBot.userUtilities.lookupUser(chat.uid);
                        if (u.lastEta !== null && (Date.now() - u.lastEta) < 1 * 60 * 60 * 1000) {
                            API.moderateDeleteChat(chat.cid);
                            return void (0);
                        }
                        else u.lastEta = Date.now();
                    }
                }
                var executed = false;

                for (var comm in baconBot.commands) {
                    var cmdCall = baconBot.commands[comm].command;
                    if (!Array.isArray(cmdCall)) {
                        cmdCall = [cmdCall]
                    }
                    for (var i = 0; i < cmdCall.length; i++) {
                        if (baconBot.settings.commandLiteral + cmdCall[i] === cmd) {
                            baconBot.commands[comm].functionality(chat, baconBot.settings.commandLiteral + cmdCall[i]);
                            executed = true;
                            break;
                        }
                    }
                }

                if (executed && userPerm === 0) {
                    baconBot.room.usercommand = false;
                    setTimeout(function () {
                        baconBot.room.usercommand = true;
                    }, baconBot.settings.commandCooldown * 1000);
                }
                if (executed) {
                    /*if (baconBot.settings.cmdDeletion) {
                        API.moderateDeleteChat(chat.cid);
                    }*/

                    //baconBot.room.allcommand = false;
                    //setTimeout(function () {
                        baconBot.room.allcommand = true;
                    //}, 5 * 1000);
                }
                return executed;
            },
            action: function (chat) {
                var user = baconBot.userUtilities.lookupUser(chat.uid);
                if (chat.type === 'message') {
                    for (var j = 0; j < baconBot.room.users.length; j++) {
                        if (baconBot.userUtilities.getUser(baconBot.room.users[j]).id === chat.uid) {
                            baconBot.userUtilities.setLastActivity(baconBot.room.users[j]);
                        }

                    }
                }
                baconBot.room.roomstats.chatmessages++;
            },
            spam: [
                'hueh', 'hu3', 'brbr', 'heu', 'brbr', 'kkkk', 'spoder', 'mafia', 'zuera', 'zueira',
                'zueria', 'aehoo', 'aheu', 'alguem', 'algum', 'brazil', 'zoeira', 'fuckadmins', 'affff', 'vaisefoder', 'huenaarea',
                'hitler', 'ashua', 'ahsu', 'ashau', 'lulz', 'huehue', 'hue', 'huehuehue', 'merda', 'pqp', 'puta', 'mulher', 'pula', 'retarda', 'caralho', 'filha', 'ppk',
                'gringo', 'fuder', 'foder', 'hua', 'ahue', 'modafuka', 'modafoka', 'mudafuka', 'mudafoka', 'ooooooooooooooo', 'foda'
            ],
            curses: [
                'nigger', 'faggot', 'nigga', 'niqqa', 'motherfucker', 'modafocka'
            ]
        },
        connectAPI: function () {
            this.proxy = {
                eventChat: $.proxy(this.eventChat, this),
                eventUserskip: $.proxy(this.eventUserskip, this),
                eventUserjoin: $.proxy(this.eventUserjoin, this),
                eventUserleave: $.proxy(this.eventUserleave, this),
                //eventFriendjoin: $.proxy(this.eventFriendjoin, this),
                eventVoteupdate: $.proxy(this.eventVoteupdate, this),
                eventCurateupdate: $.proxy(this.eventCurateupdate, this),
                eventRoomscoreupdate: $.proxy(this.eventRoomscoreupdate, this),
                eventDjadvance: $.proxy(this.eventDjadvance, this),
                //eventDjupdate: $.proxy(this.eventDjupdate, this),
                eventWaitlistupdate: $.proxy(this.eventWaitlistupdate, this),
                eventVoteskip: $.proxy(this.eventVoteskip, this),
                eventModskip: $.proxy(this.eventModskip, this),
                eventChatcommand: $.proxy(this.eventChatcommand, this),
                eventHistoryupdate: $.proxy(this.eventHistoryupdate, this),

            };
            API.on(API.CHAT, this.proxy.eventChat);
            API.on(API.USER_SKIP, this.proxy.eventUserskip);
            API.on(API.USER_JOIN, this.proxy.eventUserjoin);
            API.on(API.USER_LEAVE, this.proxy.eventUserleave);
            API.on(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.on(API.GRAB_UPDATE, this.proxy.eventCurateupdate);
            API.on(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.on(API.ADVANCE, this.proxy.eventDjadvance);
            API.on(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.on(API.MOD_SKIP, this.proxy.eventModskip);
            API.on(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.on(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        disconnectAPI: function () {
            API.off(API.CHAT, this.proxy.eventChat);
            API.off(API.USER_SKIP, this.proxy.eventUserskip);
            API.off(API.USER_JOIN, this.proxy.eventUserjoin);
            API.off(API.USER_LEAVE, this.proxy.eventUserleave);
            API.off(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.off(API.CURATE_UPDATE, this.proxy.eventCurateupdate);
            API.off(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.off(API.ADVANCE, this.proxy.eventDjadvance);
            API.off(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.off(API.MOD_SKIP, this.proxy.eventModskip);
            API.off(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.off(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        startup: function () {
            Function.prototype.toString = function () {
                return 'Function.'
            };
            var u = API.getUser();
            if (baconBot.userUtilities.getPermission(u) < 2) return API.chatLog(baconBot.chat.greyuser);
            if (baconBot.userUtilities.getPermission(u) === 2) API.chatLog(baconBot.chat.bouncer);
            baconBot.connectAPI();
            API.moderateDeleteChat = function (cid) {
                $.ajax({
                    url: "https://plug.dj/_/chat/" + cid,
                    type: "DELETE"
                })
            };

            baconBot.room.name = window.location.pathname;
            var Check;

            console.log(baconBot.room.name);

            var detect = function(){
                if(baconBot.room.name != window.location.pathname){
                    console.log("Killing bot after room change.");
                    storeToStorage();
                    baconBot.disconnectAPI();
                    setTimeout(function () {
                        kill();
                    }, 1000);
                    if (baconBot.settings.roomLock){
                        window.location = 'https://plug.dj' + baconBot.room.name;
                    }
                    else {
                        clearInterval(Check);
                    }
                }
            };

            Check = setInterval(function(){ detect() }, 2000);

            retrieveSettings();
            retrieveFromStorage();
            window.bot = baconBot;
            baconBot.roomUtilities.updateBlacklists();
            setInterval(baconBot.roomUtilities.updateBlacklists, 60 * 60 * 1000);
            baconBot.getNewBlacklistedSongs = baconBot.roomUtilities.exportNewBlacklistedSongs;
            baconBot.logNewBlacklistedSongs = baconBot.roomUtilities.logNewBlacklistedSongs;
            if (baconBot.room.roomstats.launchTime === null) {
                baconBot.room.roomstats.launchTime = Date.now();
            }

            for (var j = 0; j < baconBot.room.users.length; j++) {
                baconBot.room.users[j].inRoom = false;
            }
            var userlist = API.getUsers();
            for (var i = 0; i < userlist.length; i++) {
                var known = false;
                var ind = null;
                for (var j = 0; j < baconBot.room.users.length; j++) {
                    if (baconBot.room.users[j].id === userlist[i].id) {
                        known = true;
                        ind = j;
                    }
                }
                if (known) {
                    baconBot.room.users[ind].inRoom = true;
                }
                else {
                    baconBot.room.users.push(new baconBot.User(userlist[i].id, userlist[i].username));
                    ind = baconBot.room.users.length - 1;
                }
                var wlIndex = API.getWaitListPosition(baconBot.room.users[ind].id) + 1;
                baconBot.userUtilities.updatePosition(baconBot.room.users[ind], wlIndex);
            }
            baconBot.room.afkInterval = setInterval(function () {
                baconBot.roomUtilities.afkCheck()
            }, 10 * 1000);
            baconBot.room.autodisableInterval = setInterval(function () {
                baconBot.room.autodisableFunc();
            }, 60 * 60 * 1000);
            baconBot.loggedInID = API.getUser().id;
            baconBot.status = true;
            API.sendChat('/cap ' + baconBot.settings.startupCap);
            API.setVolume(baconBot.settings.startupVolume);
            if (baconBot.settings.autowoot) {
                $("#woot").click();
            }
            if (baconBot.settings.startupEmoji) {
                var emojibuttonoff = $(".icon-emoji-off");
                if (emojibuttonoff.length > 0) {
                    emojibuttonoff[0].click();
                }
                API.chatLog(':smile: Emojis enabled.');
            }
            else {
                var emojibuttonon = $(".icon-emoji-on");
                if (emojibuttonon.length > 0) {
                    emojibuttonon[0].click();
                }
                API.chatLog('Emojis disabled.');
            }
            API.chatLog('Avatars capped at ' + baconBot.settings.startupCap);
            API.chatLog('Volume set to ' + baconBot.settings.startupVolume);
            loadChat(API.sendChat(subChat(baconBot.chat.online, {botname: baconBot.settings.botName, version: baconBot.version})));
        },
        commands: {
            executable: function (minRank, chat) {
                var id = chat.uid;
                var perm = baconBot.userUtilities.getPermission(id);
                var minPerm;
                switch (minRank) {
                    case 'admin':
                        minPerm = 10;
                        break;
                    case 'ambassador':
                        minPerm = 7;
                        break;
                    case 'host':
                        minPerm = 5;
                        break;
                    case 'cohost':
                        minPerm = 4;
                        break;
                    case 'manager':
                        minPerm = 3;
                        break;
                    case 'mod':
                        if (baconBot.settings.bouncerPlus) {
                            minPerm = 2;
                        }
                        else {
                            minPerm = 3;
                        }
                        break;
                    case 'bouncer':
                        minPerm = 2;
                        break;
                    case 'residentdj':
                        minPerm = 1;
                        break;
                    case 'user':
                        minPerm = 0;
                        break;
                    default:
                        API.chatLog('error assigning minimum permission');
                }
                return perm >= minPerm;

            },
            /**
             command: {
                        command: 'cmd',
                        rank: 'user/bouncer/mod/manager',
                        type: 'startsWith/exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !baconBot.commands.executable(this.rank, chat) ) return void (0);
                                else{

                                }
                        }
                },
             **/

            activeCommand: {
                command: 'active',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var now = Date.now();
                        var chatters = 0;
                        var time;

                        var launchT = baconBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = durationOnline / 1000;

                        if (msg.length === cmd.length) time = since;
                        else {
                            time = msg.substring(cmd.length + 1);
                            if (isNaN(time)) return API.sendChat(subChat(baconBot.chat.invalidtime, {name: chat.un}));
                        }
                        for (var i = 0; i < baconBot.room.users.length; i++) {
                            userTime = baconBot.userUtilities.getLastActivity(baconBot.room.users[i]);
                            if ((now - userTime) <= (time * 60 * 1000)) {
                                chatters++;
                            }
                        }
                        API.sendChat(subChat(baconBot.chat.activeusersintime, {name: chat.un, amount: chatters, time: time}));
                    }
                }
            },

            addCommand: {
                command: 'add',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (msg.length > cmd.length + 2) {
                            if (typeof user !== 'undefined') {
                                if (baconBot.room.roomevent) {
                                    baconBot.room.eventArtists.push(user.id);
                                }
                                API.moderateAddDJ(user.id);
                            } else API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));
                        }
                    }
                }
            },

            afklimitCommand: {
                command: 'afklimit',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nolimitspecified, {name: chat.un}));
                        var limit = msg.substring(cmd.length + 1);
                        if (!isNaN(limit)) {
                            baconBot.settings.maximumAfk = parseInt(limit, 10);
                            API.sendChat(subChat(baconBot.chat.maximumafktimeset, {name: chat.un, time: baconBot.settings.maximumAfk}));
                        }
                        else API.sendChat(subChat(baconBot.chat.invalidlimitspecified, {name: chat.un}));
                    }
                }
            },

            afkremovalCommand: {
                command: 'afkremoval',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.afkRemoval) {
                            baconBot.settings.afkRemoval = !baconBot.settings.afkRemoval;
                            clearInterval(baconBot.room.afkInterval);
                            API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.afkremoval}));
                        }
                        else {
                            baconBot.settings.afkRemoval = !baconBot.settings.afkRemoval;
                            baconBot.room.afkInterval = setInterval(function () {
                                baconBot.roomUtilities.afkCheck()
                            }, 2 * 1000);
                            API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.afkremoval}));
                        }
                    }
                }
            },

            afkresetCommand: {
                command: 'afkreset',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));
                        baconBot.userUtilities.setLastActivity(user);
                        API.sendChat(subChat(baconBot.chat.afkstatusreset, {name: chat.un, username: name}));
                    }
                }
            },

            afktimeCommand: {
                command: 'afktime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));
                        var lastActive = baconBot.userUtilities.getLastActivity(user);
                        var inactivity = Date.now() - lastActive;
                        var time = baconBot.roomUtilities.msToStr(inactivity);

                        var launchT = baconBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;

                        if (inactivity == durationOnline){
                            API.sendChat(subChat(baconBot.chat.inactivelonger, {botname: baconBot.settings.botName, name: chat.un, username: name}));
                        } else {
                        API.sendChat(subChat(baconBot.chat.inactivefor, {name: chat.un, username: name, time: time}));
                        }
                    }
                }
            },

            autodisableCommand: {
                command: 'autodisable',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.autodisable) {
                            baconBot.settings.autodisable = !baconBot.settings.autodisable;
                            return API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.autodisable}));
                        }
                        else {
                            baconBot.settings.autodisable = !baconBot.settings.autodisable;
                            return API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.autodisable}));
                        }

                    }
                }
            },

            autoskipCommand: {
                command: 'autoskip',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.autoskip) {
                            baconBot.settings.autoskip = !baconBot.settings.autoskip;
                            clearTimeout(baconBot.room.autoskipTimer);
                            return API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.autoskip}));
                        }
                        else {
                            baconBot.settings.autoskip = !baconBot.settings.autoskip;
                            return API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.autoskip}));
                        }
                    }
                }
            },

            autowootCommand: {
                command: 'autowoot',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(baconBot.chat.autowoot);
                    }
                }
            },

            baCommand: {
                command: 'ba',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(baconBot.chat.brandambassador);
                    }
                }
            },

            ballCommand: {
                command: ['8ball', 'ask'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                            var crowd = API.getUsers();
                            var msg = chat.message;
                            var argument = msg.substring(cmd.length + 1).replace(/@/g, '');
                            var randomUser = Math.floor(Math.random() * crowd.length);
                            var randomBall = Math.floor(Math.random() * baconBot.chat.balls.length);
                            var randomSentence = Math.floor(Math.random() * 1);
                            API.sendChat(subChat(baconBot.chat.ball, {name: chat.un, botname: baconBot.settings.botName, question: argument, response: baconBot.chat.balls[randomBall]}));
                     }
                }
            },

            banCommand: {
                command: 'ban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));
                        var permFrom = baconBot.userUtilities.getPermission(chat.uid);
                        var permUser = baconBot.userUtilities.getPermission(user.id);
                        if (permUser >= permFrom) return void(0);
                        API.moderateBanUser(user.id, 1, API.BAN.DAY);
                    }
                }
            },

            blacklistCommand: {
                command: ['blacklist', 'bl'],
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nolistspecified, {name: chat.un}));
                        var list = msg.substr(cmd.length + 1);
                        if (typeof baconBot.room.blacklists[list] === 'undefined') return API.sendChat(subChat(baconBot.chat.invalidlistspecified, {name: chat.un}));
                        else {
                            var media = API.getMedia();
                            var timeLeft = API.getTimeRemaining();
                            var timeElapsed = API.getTimeElapsed();
                            var track = {
                                list: list,
                                author: media.author,
                                title: media.title,
                                mid: media.format + ':' + media.cid
                            };
                            baconBot.room.newBlacklisted.push(track);
                            baconBot.room.blacklists[list].push(media.format + ':' + media.cid);
                            API.sendChat(subChat(baconBot.chat.newblacklisted, {name: chat.un, blacklist: list, author: media.author, title: media.title, mid: media.format + ':' + media.cid}));
                            if (baconBot.settings.smartSkip && timeLeft > timeElapsed){
                                baconBot.roomUtilities.smartSkip();
                            }
                            else {
                                API.moderateForceSkip();
                            }
                            if (typeof baconBot.room.newBlacklistedSongFunction === 'function') {
                                baconBot.room.newBlacklistedSongFunction(track);
                            }
                        }
                    }
                }
            },

            blinfoCommand: {
                command: 'blinfo',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var author = API.getMedia().author;
                        var title = API.getMedia().title;
                        var name = chat.un;
                        var format = API.getMedia().format;
                        var cid = API.getMedia().cid;
                        var songid = format + ":" + cid;

                        API.sendChat(subChat(baconBot.chat.blinfo, {name: name, author: author, title: title, songid: songid}));
                    }
                }
            },

            bouncerPlusCommand: {
                command: 'bouncer+',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (baconBot.settings.bouncerPlus) {
                            baconBot.settings.bouncerPlus = false;
                            return API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': 'Bouncer+'}));
                        }
                        else {
                            if (!baconBot.settings.bouncerPlus) {
                                var id = chat.uid;
                                var perm = baconBot.userUtilities.getPermission(id);
                                if (perm > 2) {
                                    baconBot.settings.bouncerPlus = true;
                                    return API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': 'Bouncer+'}));
                                }
                            }
                            else return API.sendChat(subChat(baconBot.chat.bouncerplusrank, {name: chat.un}));
                        }
                    }
                }
            },

            botnameCommand: {
                command: 'botname',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(baconBot.chat.currentbotname, {botname: baconBot.settings.botName}));
                        var argument = msg.substring(cmd.length + 1);
                        if (argument) {
                            baconBot.settings.botName = argument;
                            API.sendChat(subChat(baconBot.chat.botnameset, {botName: baconBot.settings.botName}));
                        }
                    }
                }
            },

            clearchatCommand: {
                command: 'clearchat',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var currentchat = $('#chat-messages').children();
                        for (var i = 0; i < currentchat.length; i++) {
                            API.moderateDeleteChat(currentchat[i].getAttribute("data-cid"));
                        }
                        return API.sendChat(subChat(baconBot.chat.chatcleared, {name: chat.un}));
                    }
                }
            },

            commandsCommand: {
                command: 'commands',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(baconBot.chat.commandslink, {botname: baconBot.settings.botName, link: baconBot.cmdLink}));
                    }
                }
            },

            cmddeletionCommand: {
                command: ['commanddeletion', 'cmddeletion', 'cmddel'],
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.cmdDeletion) {
                            baconBot.settings.cmdDeletion = !baconBot.settings.cmdDeletion;
                            API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.cmddeletion}));
                        }
                        else {
                            baconBot.settings.cmdDeletion = !baconBot.settings.cmdDeletion;
                            API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.cmddeletion}));
                        }
                    }
                }
            },

            cookieCommand: {
                command: 'cookie',
                rank: 'user',
                type: 'startsWith',
                getCookie: function (chat) {
                    var c = Math.floor(Math.random() * baconBot.chat.cookies.length);
                    return baconBot.chat.cookies[c];
                },
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;

                        var space = msg.indexOf(' ');
                        if (space === -1) {
                            API.sendChat(baconBot.chat.eatcookie);
                            return false;
                        }
                        else {
                            var name = msg.substring(space + 2);
                            var user = baconBot.userUtilities.lookupUserName(name);
                            if (user === false || !user.inRoom) {
                                return API.sendChat(subChat(baconBot.chat.nousercookie, {name: name}));
                            }
                            else if (user.username === chat.un) {
                                return API.sendChat(subChat(baconBot.chat.selfcookie, {name: name}));
                            }
                            else {
                                return API.sendChat(subChat(baconBot.chat.cookie, {nameto: user.username, namefrom: chat.un, cookie: this.getCookie()}));
                            }
                        }
                    }
                }
            },
            
             baconCommand: {
                command: 'bacon',
                rank: 'user',
                type: 'startsWith',
                getBacon: function (chat) {
                    var c = Math.floor(Math.random() * baconBot.chat.bacons.length);
                    return baconBot.chat.bacons[c];
                },
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var space = msg.indexOf(' ');
                        if (space === -1) {
                            API.sendChat(baconBot.chat.eatbacon);
                            return false;
                        }
                        else {
                            var name = msg.substring(space + 2);
                            var user = baconBot.userUtilities.lookupUserName(name);
                            if (user === false || !user.inRoom) {
                                return API.sendChat(subChat(baconBot.chat.nouserbacon, {name: name}));
                            }
                            else if (user.username === chat.un) {
                                return API.sendChat(subChat(baconBot.chat.selfbacon, {name: name}));
                            }
                            else {
                                return API.sendChat(subChat(baconBot.chat.bacon, {nameto: user.username, namefrom: chat.un, bacon: this.getBacon()}));
                            }
                        }
                    }
                }
            },
            
            cycleCommand: {
                command: 'cycle',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        baconBot.roomUtilities.changeDJCycle();
                    }
                }
            },

            cycleguardCommand: {
                command: 'cycleguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.cycleGuard) {
                            baconBot.settings.cycleGuard = !baconBot.settings.cycleGuard;
                            return API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.cycleguard}));
                        }
                        else {
                            baconBot.settings.cycleGuard = !baconBot.settings.cycleGuard;
                            return API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.cycleguard}));
                        }

                    }
                }
            },

            cycletimerCommand: {
                command: 'cycletimer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var cycleTime = msg.substring(cmd.length + 1);
                        if (!isNaN(cycleTime) && cycleTime !== "") {
                            baconBot.settings.maximumCycletime = cycleTime;
                            return API.sendChat(subChat(baconBot.chat.cycleguardtime, {name: chat.un, time: baconBot.settings.maximumCycletime}));
                        }
                        else return API.sendChat(subChat(baconBot.chat.invalidtime, {name: chat.un}));

                    }
                }
            },

            dclookupCommand: {
                command: ['dclookup', 'dc'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substring(cmd.length + 2);
                            var perm = baconBot.userUtilities.getPermission(chat.uid);
                            if (perm < 2) return API.sendChat(subChat(baconBot.chat.dclookuprank, {name: chat.un}));
                        }
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));
                        var toChat = baconBot.userUtilities.dclookup(user.id);
                        API.sendChat(toChat);
                    }
                }
            },

            /*

            // This does not work anymore.

            deletechatCommand: {
                command: 'deletechat',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));
                        var chats = $('.from');
                        var message = $('.message');
                        var emote = $('.emote');
                        var from = $('.un.clickable');
                        for (var i = 0; i < chats.length; i++) {
                            var n = from[i].textContent;
                            if (name.trim() === n.trim()) {

                                // var messagecid = $(message)[i].getAttribute('data-cid');
                                // var emotecid = $(emote)[i].getAttribute('data-cid');
                                // API.moderateDeleteChat(messagecid);

                                // try {
                                //     API.moderateDeleteChat(messagecid);
                                // }
                                // finally {
                                //     API.moderateDeleteChat(emotecid);
                                // }

                                if (typeof $(message)[i].getAttribute('data-cid') == "undefined"){
                                    API.moderateDeleteChat($(emote)[i].getAttribute('data-cid')); // works well with normal messages but not with emotes due to emotes and messages are seperate.
                                } else {
                                    API.moderateDeleteChat($(message)[i].getAttribute('data-cid'));
                                }
                            }
                        }
                        API.sendChat(subChat(baconBot.chat.deletechat, {name: chat.un, username: name}));
                    }
                }
            },

            */

            deletechatCommand: {
                command: 'deletechat',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));
                        for (var i = 1; i < baconBot.room.chatMessages.length; i++) {
                          if (baconBot.room.chatMessages[i].indexOf(user.id) > -1){
                            API.moderateDeleteChat(baconBot.room.chatMessages[i][0]);
                            baconBot.room.chatMessages[i].splice(0);
                          }
                        }
                        API.sendChat(subChat(baconBot.chat.deletechat, {name: chat.un, username: name}));
                    }
                }
            },


            emojiCommand: {
                command: 'emoji',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var link = 'http://www.emoji-cheat-sheet.com/';
                        API.sendChat(subChat(baconBot.chat.emojilist, {link: link}));
                    }
                }
            },

            englishCommand: {
                command: 'english',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if(chat.message.length === cmd.length) return API.sendChat('/me No user specified.');
                        var name = chat.message.substring(cmd.length + 2);
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if(typeof user === 'boolean') return API.sendChat('/me Invalid user specified.');
                        var lang = baconBot.userUtilities.getUser(user).language;
                        var ch = '/me @' + name + ' ';
                        switch(lang){
                            case 'en': break;
                            case 'da': ch += 'Vær venlig at tale engelsk.'; break;
                            case 'de': ch += 'Bitte sprechen Sie Englisch.'; break;
                            case 'es': ch += 'Por favor, hable Inglés.'; break;
                            case 'fr': ch += 'Parlez anglais, s\'il vous plaît.'; break;
                            case 'nl': ch += 'Spreek Engels, alstublieft.'; break;
                            case 'pl': ch += 'Proszę mówić po angielsku.'; break;
                            case 'pt': ch += 'Por favor, fale Inglês.'; break;
                            case 'sk': ch += 'Hovorte po anglicky, prosím.'; break;
                            case 'cs': ch += 'Mluvte prosím anglicky.'; break;
                            case 'sr': ch += 'Молим Вас, говорите енглески.'; break;
                        }
                        ch += ' English please.';
                        API.sendChat(ch);
                    }
                }
            },

            etaCommand: {
                command: 'eta',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var perm = baconBot.userUtilities.getPermission(chat.uid);
                        var msg = chat.message;
                        var dj = API.getDJ().username;
                        var name;
                        if (msg.length > cmd.length) {
                            if (perm < 2) return void (0);
                            name = msg.substring(cmd.length + 2);
                        } else name = chat.un;
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));
                        var pos = API.getWaitListPosition(user.id);
                        var realpos = pos + 1;
                        if (name == dj) return API.sendChat(subChat(baconBot.chat.youaredj, {name: name}));
                        if (pos < 0) return API.sendChat(subChat(baconBot.chat.notinwaitlist, {name: name}));
                        if (pos == 0) return API.sendChat(subChat(baconBot.chat.youarenext, {name: name}));
                        var timeRemaining = API.getTimeRemaining();
                        var estimateMS = ((pos + 1) * 4 * 60 + timeRemaining) * 1000;
                        var estimateString = baconBot.roomUtilities.msToStr(estimateMS);
                        API.sendChat(subChat(baconBot.chat.eta, {name: name, time: estimateString, position: realpos}));
                    }
                }
            },

            fbCommand: {
                command: 'fb',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof baconBot.settings.fbLink === "string")
                            API.sendChat(subChat(baconBot.chat.facebook, {link: baconBot.settings.fbLink}));
                    }
                }
            },

            filterCommand: {
                command: 'filter',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.filterChat) {
                            baconBot.settings.filterChat = !baconBot.settings.filterChat;
                            return API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.chatfilter}));
                        }
                        else {
                            baconBot.settings.filterChat = !baconBot.settings.filterChat;
                            return API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.chatfilter}));
                        }
                    }
                }
            },

            forceskipCommand: {
                command: ['forceskip', 'fs'],
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(baconBot.chat.forceskip, {name: chat.un}));
                        API.moderateForceSkip();
                        baconBot.room.skippable = false;
                        setTimeout(function () {
                            baconBot.room.skippable = true
                        }, 5 * 1000);

                    }
                }
            },

            ghostbusterCommand: {
                command: 'ghostbuster',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substr(cmd.length + 2);
                        }
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (user === false || !user.inRoom) {
                            return API.sendChat(subChat(baconBot.chat.ghosting, {name1: chat.un, name2: name}));
                        }
                        else API.sendChat(subChat(baconBot.chat.notghosting, {name1: chat.un, name2: name}));
                    }
                }
            },

            gifCommand: {
                command: ['gif', 'giphy'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length !== cmd.length) {
                            function get_id(api_key, fixedtag, func)
                            {
                                $.getJSON(
                                    "https://tv.giphy.com/v1/gifs/random?",
                                    {
                                        "format": "json",
                                        "api_key": api_key,
                                        "rating": rating,
                                        "tag": fixedtag
                                    },
                                    function(response)
                                    {
                                        func(response.data.id);
                                    }
                                    )
                            }
                            var api_key = "dc6zaTOxFJmzC"; // public beta key
                            var rating = "pg-13"; // PG 13 gifs
                            var tag = msg.substr(cmd.length + 1);
                            var fixedtag = tag.replace(/ /g,"+");
                            var commatag = tag.replace(/ /g,", ");
                            get_id(api_key, tag, function(id) {
                                if (typeof id !== 'undefined') {
                                    API.sendChat(subChat(baconBot.chat.validgiftags, {name: chat.un, id: id, tags: commatag}));
                                } else {
                                    API.sendChat(subChat(baconBot.chat.invalidgiftags, {name: chat.un, tags: commatag}));
                                }
                            });
                        }
                        else {
                            function get_random_id(api_key, func)
                            {
                                $.getJSON(
                                    "https://tv.giphy.com/v1/gifs/random?",
                                    {
                                        "format": "json",
                                        "api_key": api_key,
                                        "rating": rating
                                    },
                                    function(response)
                                    {
                                        func(response.data.id);
                                    }
                                    )
                            }
                            var api_key = "dc6zaTOxFJmzC"; // public beta key
                            var rating = "pg-13"; // PG 13 gifs
                            get_random_id(api_key, function(id) {
                                if (typeof id !== 'undefined') {
                                    API.sendChat(subChat(baconBot.chat.validgifrandom, {name: chat.un, id: id}));
                                } else {
                                    API.sendChat(subChat(baconBot.chat.invalidgifrandom, {name: chat.un}));
                                }
                            });
                        }
                    }
                }
            },

            helpCommand: {
                command: 'help',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var link = "(Updated link coming soon)";
                        API.sendChat(subChat(baconBot.chat.starterhelp, {link: link}));
                    }
                }
            },

            historyskipCommand: {
                command: 'historyskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.historySkip) {
                            baconBot.settings.historySkip = !baconBot.settings.historySkip;
                            API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.historyskip}));
                        }
                        else {
                            baconBot.settings.historySkip = !baconBot.settings.historySkip;
                            API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.historyskip}));
                        }
                    }
                }
            },

            joinCommand: {
                command: 'join',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.room.roulette.rouletteStatus && baconBot.room.roulette.participants.indexOf(chat.uid) < 0) {
                            baconBot.room.roulette.participants.push(chat.uid);
                            API.sendChat(subChat(baconBot.chat.roulettejoin, {name: chat.un}));
                        }
                    }
                }
            },

            jointimeCommand: {
                command: 'jointime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));
                        var join = baconBot.userUtilities.getJointime(user);
                        var time = Date.now() - join;
                        var timeString = baconBot.roomUtilities.msToStr(time);
                        API.sendChat(subChat(baconBot.chat.jointime, {namefrom: chat.un, username: name, time: timeString}));
                    }
                }
            },

            kickCommand: {
                command: 'kick',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var lastSpace = msg.lastIndexOf(' ');
                        var time;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            time = 0.25;
                            name = msg.substring(cmd.length + 2);
                        }
                        else {
                            time = msg.substring(lastSpace + 1);
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }

                        var user = baconBot.userUtilities.lookupUserName(name);
                        var from = chat.un;
                        if (typeof user === 'boolean') return API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));

                        var permFrom = baconBot.userUtilities.getPermission(chat.uid);
                        var permTokick = baconBot.userUtilities.getPermission(user.id);

                        if (permFrom <= permTokick)
                            return API.sendChat(subChat(baconBot.chat.kickrank, {name: chat.un}));

                        if (!isNaN(time)) {
                            API.sendChat(subChat(baconBot.chat.kick, {name: chat.un, username: name, time: time}));
                            if (time > 24 * 60 * 60) API.moderateBanUser(user.id, 1, API.BAN.PERMA);
                            else API.moderateBanUser(user.id, 1, API.BAN.DAY);
                            setTimeout(function (id, name) {
                                API.moderateUnbanUser(id);
                                console.log('Unbanned @' + name + '. (' + id + ')');
                            }, time * 60 * 1000, user.id, name);
                        }
                        else API.sendChat(subChat(baconBot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },

            killCommand: {
                command: 'kill',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        storeToStorage();
                        API.sendChat(baconBot.chat.kill);
                        baconBot.disconnectAPI();
                        setTimeout(function () {
                            kill();
                        }, 1000);
                    }
                }
            },

            languageCommand: {
                command: 'language',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(baconBot.chat.currentlang, {language: baconBot.settings.language}));
                        var argument = msg.substring(cmd.length + 1);

                        $.get("https://rawgit.com/BaconGirl/Baconbot/master/lang/langIndex.json", function (json) {
                            var langIndex = json;
                            var link = langIndex[argument.toLowerCase()];
                            if (typeof link === "undefined") {
                                API.sendChat(subChat(baconBot.chat.langerror, {link: "http://git.io/vJ9nI"}));
                            }
                            else {
                                baconBot.settings.language = argument;
                                loadChat();
                                API.sendChat(subChat(baconBot.chat.langset, {language: baconBot.settings.language}));
                            }
                        });
                    }
                }
            },

            leaveCommand: {
                command: 'leave',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var ind = baconBot.room.roulette.participants.indexOf(chat.uid);
                        if (ind > -1) {
                            baconBot.room.roulette.participants.splice(ind, 1);
                            API.sendChat(subChat(baconBot.chat.rouletteleave, {name: chat.un}));
                        }
                    }
                }
            },

            linkCommand: {
                command: 'link',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var media = API.getMedia();
                        var from = chat.un;
                        var user = baconBot.userUtilities.lookupUser(chat.uid);
                        var perm = baconBot.userUtilities.getPermission(chat.uid);
                        var dj = API.getDJ().id;
                        var isDj = false;
                        if (dj === chat.uid) isDj = true;
                        if (perm >= 1 || isDj) {
                            if (media.format === 1) {
                                var linkToSong = "https://youtu.be/" + media.cid;
                                API.sendChat(subChat(baconBot.chat.songlink, {name: from, link: linkToSong}));
                            }
                            if (media.format === 2) {
                                SC.get('/tracks/' + media.cid, function (sound) {
                                    API.sendChat(subChat(baconBot.chat.songlink, {name: from, link: sound.permalink_url}));
                                });
                            }
                        }
                    }
                }
            },

            lockCommand: {
                command: 'lock',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        baconBot.roomUtilities.booth.lockBooth();
                    }
                }
            },

            lockdownCommand: {
                command: 'lockdown',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var temp = baconBot.settings.lockdownEnabled;
                        baconBot.settings.lockdownEnabled = !temp;
                        if (baconBot.settings.lockdownEnabled) {
                            return API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.lockdown}));
                        }
                        else return API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.lockdown}));
                    }
                }
            },

            lockguardCommand: {
                command: 'lockguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.lockGuard) {
                            baconBot.settings.lockGuard = !baconBot.settings.lockGuard;
                            return API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.lockguard}));
                        }
                        else {
                            baconBot.settings.lockGuard = !baconBot.settings.lockGuard;
                            return API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.lockguard}));
                        }
                    }
                }
            },

            lockskipCommand: {
                command: 'lockskip',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.room.skippable) {
                            var dj = API.getDJ();
                            var id = dj.id;
                            var name = dj.username;
                            var msgSend = '@' + name + ': ';
                            baconBot.room.queueable = false;

                            if (chat.message.length === cmd.length) {
                                API.sendChat(subChat(baconBot.chat.usedlockskip, {name: chat.un}));
                                baconBot.roomUtilities.booth.lockBooth();
                                setTimeout(function (id) {
                                    API.moderateForceSkip();
                                    baconBot.room.skippable = false;
                                    setTimeout(function () {
                                        baconBot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function (id) {
                                        baconBot.userUtilities.moveUser(id, baconBot.settings.lockskipPosition, false);
                                        baconBot.room.queueable = true;
                                        setTimeout(function () {
                                            baconBot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void (0);
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < baconBot.settings.lockskipReasons.length; i++) {
                                var r = baconBot.settings.lockskipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += baconBot.settings.lockskipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(subChat(baconBot.chat.usedlockskip, {name: chat.un}));
                                baconBot.roomUtilities.booth.lockBooth();
                                setTimeout(function (id) {
                                    API.moderateForceSkip();
                                    baconBot.room.skippable = false;
                                    API.sendChat(msgSend);
                                    setTimeout(function () {
                                        baconBot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function (id) {
                                        baconBot.userUtilities.moveUser(id, baconBot.settings.lockskipPosition, false);
                                        baconBot.room.queueable = true;
                                        setTimeout(function () {
                                            baconBot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void (0);
                            }
                        }
                    }
                }
            },

            locktimerCommand: {
                command: 'locktimer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var lockTime = msg.substring(cmd.length + 1);
                        if (!isNaN(lockTime) && lockTime !== "") {
                            baconBot.settings.maximumLocktime = lockTime;
                            return API.sendChat(subChat(baconBot.chat.lockguardtime, {name: chat.un, time: baconBot.settings.maximumLocktime}));
                        }
                        else return API.sendChat(subChat(baconBot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },

            logoutCommand: {
                command: 'logout',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(baconBot.chat.logout, {name: chat.un, botname: baconBot.settings.botName}));
                        setTimeout(function () {
                            $(".logout").mousedown()
                        }, 1000);
                    }
                }
            },

            maxlengthCommand: {
                command: 'maxlength',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var maxTime = msg.substring(cmd.length + 1);
                        if (!isNaN(maxTime)) {
                            baconBot.settings.maximumSongLength = maxTime;
                            return API.sendChat(subChat(baconBot.chat.maxlengthtime, {name: chat.un, time: baconBot.settings.maximumSongLength}));
                        }
                        else return API.sendChat(subChat(baconBot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },

            motdCommand: {
                command: 'motd',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat('/me MotD: ' + baconBot.settings.motd);
                        var argument = msg.substring(cmd.length + 1);
                        if (!baconBot.settings.motdEnabled) baconBot.settings.motdEnabled = !baconBot.settings.motdEnabled;
                        if (isNaN(argument)) {
                            baconBot.settings.motd = argument;
                            API.sendChat(subChat(baconBot.chat.motdset, {msg: baconBot.settings.motd}));
                        }
                        else {
                            baconBot.settings.motdInterval = argument;
                            API.sendChat(subChat(baconBot.chat.motdintervalset, {interval: baconBot.settings.motdInterval}));
                        }
                    }
                }
            },

            moveCommand: {
                command: 'move',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var pos;
                        var name;
                        if (isNaN(parseInt(msg.substring(lastSpace + 1)))) {
                            pos = 1;
                            name = msg.substring(cmd.length + 2);
                        }
                        else {
                            pos = parseInt(msg.substring(lastSpace + 1));
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));
                        if (user.id === baconBot.loggedInID) return API.sendChat(subChat(baconBot.chat.addbotwaitlist, {name: chat.un}));
                        if (!isNaN(pos)) {
                            API.sendChat(subChat(baconBot.chat.move, {name: chat.un}));
                            baconBot.userUtilities.moveUser(user.id, pos, false);
                        } else return API.sendChat(subChat(baconBot.chat.invalidpositionspecified, {name: chat.un}));
                    }
                }
            },

            muteCommand: {
                command: 'mute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));
                        var lastSpace = msg.lastIndexOf(' ');
                        var time = null;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            name = msg.substring(cmd.length + 2);
                            time = 45;
                        }
                        else {
                            time = msg.substring(lastSpace + 1);
                            if (isNaN(time) || time == "" || time == null || typeof time == "undefined") {
                                return API.sendChat(subChat(baconBot.chat.invalidtime, {name: chat.un}));
                            }
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var from = chat.un;
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));
                        var permFrom = baconBot.userUtilities.getPermission(chat.uid);
                        var permUser = baconBot.userUtilities.getPermission(user.id);
                        if (permFrom > permUser) {
                            /*
                             baconBot.room.mutedUsers.push(user.id);
                             if (time === null) API.sendChat(subChat(baconBot.chat.mutednotime, {name: chat.un, username: name}));
                             else {
                             API.sendChat(subChat(baconBot.chat.mutedtime, {name: chat.un, username: name, time: time}));
                             setTimeout(function (id) {
                             var muted = baconBot.room.mutedUsers;
                             var wasMuted = false;
                             var indexMuted = -1;
                             for (var i = 0; i < muted.length; i++) {
                             if (muted[i] === id) {
                             indexMuted = i;
                             wasMuted = true;
                             }
                             }
                             if (indexMuted > -1) {
                             baconBot.room.mutedUsers.splice(indexMuted);
                             var u = baconBot.userUtilities.lookupUser(id);
                             var name = u.username;
                             API.sendChat(subChat(baconBot.chat.unmuted, {name: chat.un, username: name}));
                             }
                             }, time * 60 * 1000, user.id);
                             }
                             */
                            if (time > 45) {
                                API.sendChat(subChat(baconBot.chat.mutedmaxtime, {name: chat.un, time: "45"}));
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                            }
                            else if (time === 45) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(baconBot.chat.mutedtime, {name: chat.un, username: name, time: time}));

                            }
                            else if (time > 30) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(baconBot.chat.mutedtime, {name: chat.un, username: name, time: time}));
                                setTimeout(function (id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                            else if (time > 15) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.MEDIUM);
                                API.sendChat(subChat(baconBot.chat.mutedtime, {name: chat.un, username: name, time: time}));
                                setTimeout(function (id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                            else {
                                API.moderateMuteUser(user.id, 1, API.MUTE.SHORT);
                                API.sendChat(subChat(baconBot.chat.mutedtime, {name: chat.un, username: name, time: time}));
                                setTimeout(function (id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                        }
                        else API.sendChat(subChat(baconBot.chat.muterank, {name: chat.un}));
                    }
                }
            },

            opCommand: {
                command: 'op',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof baconBot.settings.opLink === "string")
                            return API.sendChat(subChat(baconBot.chat.oplist, {link: baconBot.settings.opLink}));
                    }
                }
            },

            pingCommand: {
                command: 'ping',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(baconBot.chat.pong)
                    }
                }
            },

            refreshCommand: {
                command: 'refresh',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        storeToStorage();
                        baconBot.disconnectAPI();
                        setTimeout(function () {
                            window.location.reload(false);
                        }, 1000);

                    }
                }
            },

            reloadCommand: {
                command: 'reload',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(baconBot.chat.reload);
                        storeToStorage();
                        baconBot.disconnectAPI();
                        kill();
                        setTimeout(function () {
                            $.getScript(baconBot.settings.scriptLink);
                        }, 2000);
                    }
                }
            },

            removeCommand: {
                command: 'remove',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length > cmd.length + 2) {
                            var name = msg.substr(cmd.length + 2);
                            var user = baconBot.userUtilities.lookupUserName(name);
                            if (typeof user !== 'boolean') {
                                user.lastDC = {
                                    time: null,
                                    position: null,
                                    songCount: 0
                                };
                                if (API.getDJ().id === user.id) {
                                    API.moderateForceSkip();
                                    setTimeout(function () {
                                        API.moderateRemoveDJ(user.id);
                                    }, 1 * 1000, user);
                                }
                                else API.moderateRemoveDJ(user.id);
                            } else API.sendChat(subChat(baconBot.chat.removenotinwl, {name: chat.un, username: name}));
                        } else API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));
                    }
                }
            },

            restrictetaCommand: {
                command: 'restricteta',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.etaRestriction) {
                            baconBot.settings.etaRestriction = !baconBot.settings.etaRestriction;
                            return API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.etarestriction}));
                        }
                        else {
                            baconBot.settings.etaRestriction = !baconBot.settings.etaRestriction;
                            return API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.etarestriction}));
                        }
                    }
                }
            },

            rouletteCommand: {
                command: 'roulette',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (!baconBot.room.roulette.rouletteStatus) {
                            baconBot.room.roulette.startRoulette();
                        }
                    }
                }
            },

            rulesCommand: {
                command: 'rules',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof baconBot.settings.rulesLink === "string")
                            return API.sendChat(subChat(baconBot.chat.roomrules, {link: baconBot.settings.rulesLink}));
                    }
                }
            },

            sessionstatsCommand: {
                command: 'sessionstats',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var from = chat.un;
                        var woots = baconBot.room.roomstats.totalWoots;
                        var mehs = baconBot.room.roomstats.totalMehs;
                        var grabs = baconBot.room.roomstats.totalCurates;
                        API.sendChat(subChat(baconBot.chat.sessionstats, {name: from, woots: woots, mehs: mehs, grabs: grabs}));
                    }
                }
            },

            skipCommand: {
                command: ['skip', 'smartskip'],
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.room.skippable) {

                            var timeLeft = API.getTimeRemaining();
                            var timeElapsed = API.getTimeElapsed();
                            var dj = API.getDJ();
                            var name = dj.username;
                            var msgSend = '@' + name + ', ';

                            if (chat.message.length === cmd.length) {
                                API.sendChat(subChat(baconBot.chat.usedskip, {name: chat.un}));
                                if (baconBot.settings.smartSkip && timeLeft > timeElapsed){
                                    baconBot.roomUtilities.smartSkip();
                                }
                                else {
                                    API.moderateForceSkip();
                                }
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < baconBot.settings.skipReasons.length; i++) {
                                var r = baconBot.settings.skipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += baconBot.settings.skipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(subChat(baconBot.chat.usedskip, {name: chat.un}));
                                if (baconBot.settings.smartSkip && timeLeft > timeElapsed){
                                    baconBot.roomUtilities.smartSkip(msgSend);
                                }
                                else {
                                    API.moderateForceSkip();
                                    setTimeout(function () {
                                        API.sendChat(msgSend);
                                    }, 500);
                                }
                            }
                        }
                    }
                }
            },

            skipposCommand: {
                command: 'skippos',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var pos = msg.substring(cmd.length + 1);
                        if (!isNaN(pos)) {
                            baconBot.settings.skipPosition = pos;
                            return API.sendChat(subChat(baconBot.chat.skippos, {name: chat.un, position: baconBot.settings.skipPosition}));
                        }
                        else return API.sendChat(subChat(baconBot.chat.invalidpositionspecified, {name: chat.un}));
                    }
                }
            },

            songstatsCommand: {
                command: 'songstats',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.songstats) {
                            baconBot.settings.songstats = !baconBot.settings.songstats;
                            return API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.songstats}));
                        }
                        else {
                            baconBot.settings.songstats = !baconBot.settings.songstats;
                            return API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.songstats}));
                        }
                    }
                }
            },

            sourceCommand: {
                command: 'source',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat('/me This bot was created by ' + botCreator + ', but is now maintained by ' + botMaintainer + ".");
                    }
                }
            },

            statusCommand: {
                command: 'status',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var from = chat.un;
                        var msg = '[@' + from + '] ';

                        msg += baconBot.chat.afkremoval + ': ';
                        if (baconBot.settings.afkRemoval) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += baconBot.chat.afksremoved + ": " + baconBot.room.afkList.length + '. ';
                        msg += baconBot.chat.afklimit + ': ' + baconBot.settings.maximumAfk + '. ';

                        msg += 'Bouncer+: ';
                        if (baconBot.settings.bouncerPlus) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += baconBot.chat.blacklist + ': ';
                        if (baconBot.settings.blacklistEnabled) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += baconBot.chat.lockguard + ': ';
                        if (baconBot.settings.lockGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += baconBot.chat.cycleguard + ': ';
                        if (baconBot.settings.cycleGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += baconBot.chat.timeguard + ': ';
                        if (baconBot.settings.timeGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += baconBot.chat.chatfilter + ': ';
                        if (baconBot.settings.filterChat) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += baconBot.chat.historyskip + ': ';
                        if (baconBot.settings.historySkip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += baconBot.chat.voteskip + ': ';
                        if (baconBot.settings.voteSkip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += baconBot.chat.cmddeletion + ': ';
                        if (baconBot.settings.cmdDeletion) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += baconBot.chat.autoskip + ': ';
                        if (baconBot.settings.autoskip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        // TODO: Display more toggleable bot settings.

                        var launchT = baconBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = baconBot.roomUtilities.msToStr(durationOnline);
                        msg += subChat(baconBot.chat.activefor, {time: since});

                        /*
                        // least efficient way to go about this, but it works :)
                        if (msg.length > 250){
                            firstpart = msg.substr(0, 250);
                            secondpart = msg.substr(250);
                            API.sendChat(firstpart);
                            setTimeout(function () {
                                API.sendChat(secondpart);
                            }, 300);
                        }
                        else {
                            API.sendChat(msg);
                        }
                        */

                        // This is a more efficient solution
                        if (msg.length > 250){
                            var split = msg.match(/.{1,250}/g);
                            for (var i = 0; i < split.length; i++) {
                                var func = function(index) {
                                    setTimeout(function() {
                                        API.sendChat("/me " + split[index]);
                                    }, 500 * index);
                                }
                                func(i);
                            }
                        }
                        else {
                            return API.sendChat(msg);
                        }
                    }
                }
            },

            swapCommand: {
                command: 'swap',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var name1 = msg.substring(cmd.length + 2, lastSpace);
                        var name2 = msg.substring(lastSpace + 2);
                        var user1 = baconBot.userUtilities.lookupUserName(name1);
                        var user2 = baconBot.userUtilities.lookupUserName(name2);
                        if (typeof user1 === 'boolean' || typeof user2 === 'boolean') return API.sendChat(subChat(baconBot.chat.swapinvalid, {name: chat.un}));
                        if (user1.id === baconBot.loggedInID || user2.id === baconBot.loggedInID) return API.sendChat(subChat(baconBot.chat.addbottowaitlist, {name: chat.un}));
                        var p1 = API.getWaitListPosition(user1.id) + 1;
                        var p2 = API.getWaitListPosition(user2.id) + 1;
                        if (p1 < 0 || p2 < 0) return API.sendChat(subChat(baconBot.chat.swapwlonly, {name: chat.un}));
                        API.sendChat(subChat(baconBot.chat.swapping, {'name1': name1, 'name2': name2}));
                        if (p1 < p2) {
                            baconBot.userUtilities.moveUser(user2.id, p1, false);
                            setTimeout(function (user1, p2) {
                                baconBot.userUtilities.moveUser(user1.id, p2, false);
                            }, 2000, user1, p2);
                        }
                        else {
                            baconBot.userUtilities.moveUser(user1.id, p2, false);
                            setTimeout(function (user2, p1) {
                                baconBot.userUtilities.moveUser(user2.id, p1, false);
                            }, 2000, user2, p1);
                        }
                    }
                }
            },

            themeCommand: {
                command: 'theme',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof baconBot.settings.themeLink === "string")
                            API.sendChat(subChat(baconBot.chat.genres, {link: baconBot.settings.themeLink}));
                    }
                }
            },

            timeguardCommand: {
                command: 'timeguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.timeGuard) {
                            baconBot.settings.timeGuard = !baconBot.settings.timeGuard;
                            return API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.timeguard}));
                        }
                        else {
                            baconBot.settings.timeGuard = !baconBot.settings.timeGuard;
                            return API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.timeguard}));
                        }

                    }
                }
            },

            toggleblCommand: {
                command: 'togglebl',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var temp = baconBot.settings.blacklistEnabled;
                        baconBot.settings.blacklistEnabled = !temp;
                        if (baconBot.settings.blacklistEnabled) {
                          return API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.blacklist}));
                        }
                        else return API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.blacklist}));
                    }
                }
            },

            togglemotdCommand: {
                command: 'togglemotd',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.motdEnabled) {
                            baconBot.settings.motdEnabled = !baconBot.settings.motdEnabled;
                            API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.motd}));
                        }
                        else {
                            baconBot.settings.motdEnabled = !baconBot.settings.motdEnabled;
                            API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.motd}));
                        }
                    }
                }
            },

            togglevoteskipCommand: {
                command: 'togglevoteskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.voteSkip) {
                            baconBot.settings.voteSkip = !baconBot.settings.voteSkip;
                            API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.voteskip}));
                        }
                        else {
                            baconBot.settings.voteSkip = !baconBot.settings.voteSkip;
                            API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.voteskip}));
                        }
                    }
                }
            },

            unbanCommand: {
                command: 'unban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        $(".icon-population").click();
                        $(".icon-ban").click();
                        setTimeout(function (chat) {
                            var msg = chat.message;
                            if (msg.length === cmd.length) return API.sendChat();
                            var name = msg.substring(cmd.length + 2);
                            var bannedUsers = API.getBannedUsers();
                            var found = false;
                            var bannedUser = null;
                            for (var i = 0; i < bannedUsers.length; i++) {
                                var user = bannedUsers[i];
                                if (user.username === name) {
                                    bannedUser = user;
                                    found = true;
                                }
                            }
                            if (!found) {
                                $(".icon-chat").click();
                                return API.sendChat(subChat(baconBot.chat.notbanned, {name: chat.un}));
                            }
                            API.moderateUnbanUser(bannedUser.id);
                            console.log("Unbanned " + name);
                            setTimeout(function () {
                                $(".icon-chat").click();
                            }, 1000);
                        }, 1000, chat);
                    }
                }
            },

            unlockCommand: {
                command: 'unlock',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        baconBot.roomUtilities.booth.unlockBooth();
                    }
                }
            },

            unmuteCommand: {
                command: 'unmute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var permFrom = baconBot.userUtilities.getPermission(chat.uid);
                        /**
                         if (msg.indexOf('@') === -1 && msg.indexOf('all') !== -1) {
                            if (permFrom > 2) {
                                baconBot.room.mutedUsers = [];
                                return API.sendChat(subChat(baconBot.chat.unmutedeveryone, {name: chat.un}));
                            }
                            else return API.sendChat(subChat(baconBot.chat.unmuteeveryonerank, {name: chat.un}));
                        }
                         **/
                        var from = chat.un;
                        var name = msg.substr(cmd.length + 2);

                        var user = baconBot.userUtilities.lookupUserName(name);

                        if (typeof user === 'boolean') return API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));

                        var permUser = baconBot.userUtilities.getPermission(user.id);
                        if (permFrom > permUser) {
                            /*
                             var muted = baconBot.room.mutedUsers;
                             var wasMuted = false;
                             var indexMuted = -1;
                             for (var i = 0; i < muted.length; i++) {
                             if (muted[i] === user.id) {
                             indexMuted = i;
                             wasMuted = true;
                             }

                             }
                             if (!wasMuted) return API.sendChat(subChat(baconBot.chat.notmuted, {name: chat.un}));
                             baconBot.room.mutedUsers.splice(indexMuted);
                             API.sendChat(subChat(baconBot.chat.unmuted, {name: chat.un, username: name}));
                             */
                            try {
                                API.moderateUnmuteUser(user.id);
                                API.sendChat(subChat(baconBot.chat.unmuted, {name: chat.un, username: name}));
                            }
                            catch (e) {
                                API.sendChat(subChat(baconBot.chat.notmuted, {name: chat.un}));
                            }
                        }
                        else API.sendChat(subChat(baconBot.chat.unmuterank, {name: chat.un}));
                    }
                }
            },

            usercmdcdCommand: {
                command: 'usercmdcd',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var cd = msg.substring(cmd.length + 1);
                        if (!isNaN(cd)) {
                            baconBot.settings.commandCooldown = cd;
                            return API.sendChat(subChat(baconBot.chat.commandscd, {name: chat.un, time: baconBot.settings.commandCooldown}));
                        }
                        else return API.sendChat(subChat(baconBot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },

            usercommandsCommand: {
                command: 'usercommands',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.usercommandsEnabled) {
                            API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.usercommands}));
                            baconBot.settings.usercommandsEnabled = !baconBot.settings.usercommandsEnabled;
                        }
                        else {
                            API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.usercommands}));
                            baconBot.settings.usercommandsEnabled = !baconBot.settings.usercommandsEnabled;
                        }
                    }
                }
            },

            voteratioCommand: {
                command: 'voteratio',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(baconBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = baconBot.userUtilities.lookupUserName(name);
                        if (user === false) return API.sendChat(subChat(baconBot.chat.invaliduserspecified, {name: chat.un}));
                        var vratio = user.votes;
                        var ratio = vratio.woot / vratio.meh;
                        API.sendChat(subChat(baconBot.chat.voteratio, {name: chat.un, username: name, woot: vratio.woot, mehs: vratio.meh, ratio: ratio.toFixed(2)}));
                    }
                }
            },

            voteskipCommand: {
                command: 'voteskip',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(baconBot.chat.voteskiplimit, {name: chat.un, limit: baconBot.settings.voteSkipLimit}));
                        var argument = msg.substring(cmd.length + 1);
                        if (!baconBot.settings.voteSkip) baconBot.settings.voteSkip = !baconBot.settings.voteSkip;
                        if (isNaN(argument)) {
                            API.sendChat(subChat(baconBot.chat.voteskipinvalidlimit, {name: chat.un}));
                        }
                        else {
                            baconBot.settings.voteSkipLimit = argument;
                            API.sendChat(subChat(baconBot.chat.voteskipsetlimit, {name: chat.un, limit: baconBot.settings.voteSkipLimit}));
                        }
                    }
                }
            },

            welcomeCommand: {
                command: 'welcome',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (baconBot.settings.welcome) {
                            baconBot.settings.welcome = !baconBot.settings.welcome;
                            return API.sendChat(subChat(baconBot.chat.toggleoff, {name: chat.un, 'function': baconBot.chat.welcomemsg}));
                        }
                        else {
                            baconBot.settings.welcome = !baconBot.settings.welcome;
                            return API.sendChat(subChat(baconBot.chat.toggleon, {name: chat.un, 'function': baconBot.chat.welcomemsg}));
                        }
                    }
                }
            },

            websiteCommand: {
                command: 'website',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof baconBot.settings.website === "string")
                            API.sendChat(subChat(baconBot.chat.website, {link: baconBot.settings.website}));
                    }
                }
            },

            whoisCommand: {
                command: 'whois',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substr(cmd.length + 2);
                        }
                        users = API.getUsers();
                        var len = users.length;
                        for (var i = 0; i < len; ++i){
                            if (users[i].username == name){
                                var id = users[i].id;
                                var avatar = API.getUser(id).avatarID;
                                var level = API.getUser(id).level;
                                var rawjoined = API.getUser(id).joined;
                                var joined = rawjoined.substr(0, 10);
                                var rawlang = API.getUser(id).language;
                                if (rawlang == "en"){
                                    var language = "English";
                                } else if (rawlang == "bg"){
                                    var language = "Bulgarian";
                                } else if (rawlang == "cs"){
                                    var language = "Czech";
                                } else if (rawlang == "fi"){
                                    var language = "Finnish"
                                } else if (rawlang == "fr"){
                                    var language = "French"
                                } else if (rawlang == "pt"){
                                    var language = "Portuguese"
                                } else if (rawlang == "zh"){
                                    var language = "Chinese"
                                } else if (rawlang == "sk"){
                                    var language = "Slovak"
                                } else if (rawlang == "nl"){
                                    var language = "Dutch"
                                } else if (rawlang == "ms"){
                                    var language = "Malay"
                                }
                                var rawrank = API.getUser(id).role;
                                if (rawrank == "0"){
                                    var rank = "User";
                                } else if (rawrank == "1"){
                                    var rank = "Resident DJ";
                                } else if (rawrank == "2"){
                                    var rank = "Bouncer";
                                } else if (rawrank == "3"){
                                    var rank = "Manager"
                                } else if (rawrank == "4"){
                                    var rank = "Co-Host"
                                } else if (rawrank == "5"){
                                    var rank = "Host"
                                } else if (rawrank == "7"){
                                    var rank = "Brand Ambassador"
                                } else if (rawrank == "10"){
                                    var rank = "Admin"
                                }
                                var slug = API.getUser(id).slug;
                                if (typeof slug !== 'undefined') {
                                    var profile = "https://plug.dj/@/" + slug;
                                } else {
                                    var profile = "~";
                                }

                                API.sendChat(subChat(baconBot.chat.whois, {name1: chat.un, name2: name, id: id, avatar: avatar, profile: profile, language: language, level: level, joined: joined, rank: rank}));
                            }
                        }
                    }
                }
            },

            youtubeCommand: {
                command: 'youtube',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!baconBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof baconBot.settings.youtubeLink === "string")
                            API.sendChat(subChat(baconBot.chat.youtube, {name: chat.un, link: baconBot.settings.youtubeLink}));
                    }
                }
            }
        }
    };

    loadChat(baconBot.startup);
}).call(this);
