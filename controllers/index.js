const debug = require("debug")("nikocam");
const axios = require("axios");
const path = require("path");
const fsPromises = require("fs/promises");
const { DateTime } = require("luxon");

const MOTION_DIR = process.env.MOTION_DIR;
const MOTION_URL = process.env.MOTION_URL;
const MOTION_FILES = process.env.MOTION_FILES;

const getFiles = async () => {
    if (MOTION_FILES) {
        const res = await axios(MOTION_FILES);
        //debug(res.data);
        return res.data;
    } else {
        return await fsPromises.readdir(MOTION_DIR);
    }
};

const getVideos = async () => {
    const files = await fsPromises.readdir(MOTION_DIR);

    const re = /^(?<dt>(?<date>\d+)-(?<time>\d+))-(?<idx>\d+).(?<ext>\w+(?:.json)?)$/;
    const extmap = { mp4: "video", jpg: "image", "mp4.json": "json" };
    const videomap = new Map();
    const imagemap = new Map();
    const jsonmap = new Map();
    const maps = { video: videomap, image: imagemap, json: jsonmap };

    for (const f of files) {
        const m = f.match(re);
        if (!m) continue;
        const type = extmap[m.groups.ext];
        if (!type) continue;
        const map = maps[type];
        const dt = DateTime.fromFormat(m.groups.dt, "yyyyMMdd-HHmmss");

        const info = { filename: f, dt: dt };
        map.set(m.groups.idx, info);
    }

    const promises = [];
    for (const [idx, v] of videomap.entries()) {
        //debug(v);
        const image = imagemap.get(idx);
        if (!image) continue;
        const json = jsonmap.get(idx);
        if (!json) continue;

        v.image = image;
        promises.push((async () => {
            v.info = JSON.parse(await fsPromises.readFile(path.resolve(MOTION_DIR, json.filename)));
            return v;
        })());
    }
    const videos = await Promise.all(promises);
    videos.sort((a, b) => a.dt.toMillis() - b.dt.toMillis());
    videos.reverse();

    for (const v of videos) {
        v.dt = v.dt.toJSON();
    }
    
    return videos;
};

const videos = async (req, res) => {
    const videos = await getVideos();
    res.json(videos, null, 2);
};

const index = async (req, res) => {
    const videos = await getVideos();

    res.render("index", {
        videos,
        DateTime,
        MOTION_URL
    });
};

module.exports = {
    index,
    videos
};