const uuid = require("uuid");
const Tracks = require("../models/tracks");
const Playlists = require("../models/playlist");
const { default: axios } = require("axios");
const {getConfig} = require('../utils/token');
const PlaylistTracks = require("../models/playlistTracks");

const getTracksByPlaylist = async (playlistId) => {
  try {
    const tracks = await Tracks.findAll({
      include: {
        model: Playlists,
        where: {
          id: playlistId,
        },
        right: true,
        required: true
      },
    });
    
    if(tracks.length === 0) return {tracks: []}
    console.log(JSON.stringify(tracks))

    const ids = tracks.map((track) => track.spotifyId).join(",")
    console.log({ids})
    const config = await getConfig()

    const {data} = await axios.get(`https://api.spotify.com/v1/tracks?ids=${ids}`, config)
    console.log({data})
    return data
  }catch(err){
    return err
  }
};

const createTrack = async (spotifyId, playlistId) => {
  const [newTrack] = await Tracks.findOrCreate({
    where: { spotifyId },
    defaults: {
      spotifyId,
      id: uuid.v4(),
    },
  });

  await PlaylistTracks.create({
    id: uuid.v4(),
    TrackId: newTrack.id,
    PlaylistId: playlistId
  })

  return newTrack;
};

const createTracks = async (tracks, playlistId) => {
  const results = await Promise.all(
    tracks.map(async (track) => {
      const result = await createTrack(track.id, playlistId);
      return result;
    })
  );
  return results;
};

const searchTrack = async (queryParams) => {
  const config = await getConfig();

  const iterableQueryParams = Object.keys(queryParams)
  
  const url = new URL("https://api.spotify.com/v1/search")

  url.searchParams.append("type", "track")

  iterableQueryParams.forEach((queryParamKey) => url.searchParams.append(queryParamKey, queryParams[queryParamKey]))

  const {data} = await axios.get(url.href, config)
  
  return data
}

module.exports = {
  createTracks,
  getTracksByPlaylist,
  searchTrack
};
