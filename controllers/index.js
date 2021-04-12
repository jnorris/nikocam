const debug = require("debug")("nikocam");
const axios = require("axios");
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

const getVideos = (files) => {
    const re = /^(?<dt>(?<date>\d+)-(?<time>\d+))-(?<idx>\d+).(?<ext>\w+)$/;
    const extmap = { mp4: "video", jpg: "image" };
    const filemap = new Map();
    for (const f of files) {
        const m = f.match(re);
        if (!m) continue;
        const type = extmap[m.groups.ext];
        if (!type) continue;
        const info = { ...m.groups, type: type, filename: f };
        info.dt = DateTime.fromFormat(info.dt, "yyyyMMdd-HHmmss");
        const idx = info.idx;
        let ff = filemap.get(idx);
        if (!ff) {
            filemap.set(idx, ff = {});
        }
        ff[type] = info;
    }

    const videos = [];
    for (const [k, v] of filemap.entries()) {
        if (v.image && v.video) {
            videos.push(v);
        }
    }
    videos.sort((a, b) => a.video.dt.toMillis() - b.video.dt.toMillis());
    videos.reverse();
    //debug(videos);

    return videos;
};

const files = async (req, res) => {
    const files = await fsPromises.readdir(MOTION_DIR);
    res.json(files);
};

const index = async (req, res) => {
    const files = await getFiles();
    const videos = getVideos(files);

    res.render("index", {
        videos,
        DateTime,
        MOTION_URL: process.env.MOTION_URL
    });
};

module.exports = {
    index,
    files
};