import React, { useEffect, useState } from "react";

import { useSelector, useDispatch } from "react-redux";
import {
  GET_DEVICE_ID,
  GET_CURRENTLY_PLAYING,
  SET_CURRENTLY_PLAYING,
  GET_PLAYING_STATE,
  SET_PLAYING_STATE,
  SET_PLAYBACK_STATE,
  GET_SHUFFLE_STATE,
  GET_REPEAT_STATE,
  SET_SHUFFLE_STATE,
} from "../../states/appSlice";

import { useHistory } from "react-router";

import styled from "styled-components";
import { Grid, Slider } from "@material-ui/core";
import {
  PauseCircleOutline,
  PlayCircleOutline,
  PlaylistPlay,
  Repeat,
  RepeatOne,
  Shuffle,
  SkipNext,
  SkipPrevious,
  VolumeDown,
  VolumeOff,
  VolumeUp,
} from "@material-ui/icons";

import axios from "axios";
import LyricsModal from "./LyricsModal";

import SpotifyWebApi from "spotify-web-api-js";
import { client_id } from "../../utils/";

const spotify = new SpotifyWebApi(client_id);

const MusicPlayer = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const device_id = useSelector(GET_DEVICE_ID);

  const currentlyPlaying = useSelector(GET_CURRENTLY_PLAYING);

  const playingState = useSelector(GET_PLAYING_STATE);

  const shuffleState = useSelector(GET_SHUFFLE_STATE);

  const repeatState = useSelector(GET_REPEAT_STATE);

  const [lyricsObj, setLyricsObj] = useState({
    lyrics: "",
    title: "",
    artist: "",
  });

  const [volume, setVolume] = useState(65);

  const [duration, setDuration] = useState();

  useEffect(() => {
    if (!currentlyPlaying) return;

    spotify.getMyCurrentPlayingTrack().then((current_track) => {
      const duration = current_track.item?.duration_ms;
      setDuration(duration);
    });

    const interval = setInterval(() => {
      spotify.getMyCurrentPlayingTrack().then((current_track) => {
        if (current_track.item?.uri !== currentlyPlaying?.uri) {
          dispatch(
            SET_CURRENTLY_PLAYING({
              currently_playing: current_track?.item,
            })
          );
        }
      });
    }, duration + 500);

    return () => clearInterval(interval);
  }, [currentlyPlaying, duration]);

  useEffect(() => {
    if (typeof currentlyPlaying === "undefined") return;

    const title = currentlyPlaying.name;
    const artists = currentlyPlaying.artists;

    axios
      .get(`https://api.lyrics.ovh/v1/${artists?.[0].name}/${title}`)
      .then((res) => {
        setLyricsObj({
          lyrics: res.data.lyrics,
          title,
          artist: artists?.[0].name,
        });
      })
      .catch(() => {
        setLyricsObj({
          lyrics: "No Lyrics Found",
          title: "",
          artist: "",
        });
      });
  }, [currentlyPlaying]);

  // useEffect(() => {
  //   spotify.getMyCurrentPlaybackState().then((res) => {
  //     const volume = res.device?.volume_percent;
  //     setVolume(volume);
  //   });
  // }, [volume]);

  const handlePlay = () => {
    if (!playingState) {
      spotify
        .play({ device_id, uris: [currentlyPlaying.uri] })
        .then(() => {
          spotify.getMyCurrentPlayingTrack().then((current_track) => {
            dispatch(
              SET_CURRENTLY_PLAYING({
                currently_playing: current_track.item,
              })
            );
            return current_track;
          });
        })
        .then(() => {
          dispatch(
            SET_PLAYING_STATE({
              playing_state: true,
            })
          );
        });
    } else {
      spotify.pause({ device_id }).then(() => {
        dispatch(
          SET_PLAYING_STATE({
            playing_state: false,
          })
        );
      });
    }
  };

  const handleNext = () => {
    spotify.skipToNext({ device_id }).then(() => {
      spotify.getMyCurrentPlayingTrack().then((current_track) => {
        dispatch(
          SET_CURRENTLY_PLAYING({
            currently_playing: current_track.item,
          })
        );
      });
    });
  };

  const handlePrev = () => {
    spotify.skipToPrevious({ device_id }).then(() => {
      spotify.getMyCurrentPlayingTrack().then((current_track) => {
        dispatch(
          SET_CURRENTLY_PLAYING({
            currently_playing: current_track.item,
          })
        );
      });
    });
  };

  const handleShuffleState = () => {
    if (!shuffleState) {
      spotify.setShuffle(true).then(() => {
        dispatch(
          SET_SHUFFLE_STATE({
            shuffle_state: true,
          })
        );
      });
    } else {
      spotify.setShuffle(false).then(() => {
        dispatch(
          SET_SHUFFLE_STATE({
            shuffle_state: false,
          })
        );
      });
    }
  };

  const handleReplayState = () => {
    if (repeatState === "context") {
      spotify.setRepeat("off");
    } else {
      spotify.setRepeat("context");
    }
  };

  const handleSetRepeatAll = async () => {
    await spotify.setRepeat("context").then((res) => {
      dispatch(
        SET_PLAYBACK_STATE({
          playbackState: res.repeat_state,
        })
      );
    });
  };

  const handleSetRepeatOne = async () => {
    await spotify.setRepeat("track").then((res) => {
      dispatch(
        SET_PLAYBACK_STATE({
          playbackState: res.repeat_state,
        })
      );
    });
  };

  const handleSetRepeatOff = async () => {
    await spotify.setRepeat("off").then((res) => {
      dispatch(
        SET_PLAYBACK_STATE({
          playbackState: res.repeat_state,
        })
      );
    });
  };

  const handleVolume = async (_, value) => {
    setVolume(value);

    await spotify.setVolume(volume);
  };

  const handleVolumeMute = async (e) => {
    e.preventDefault();

    if (volume === 0) {
      setVolume(60);
      await spotify.setVolume(60);
    } else {
      setVolume(0);
      await spotify.setVolume(0);
    }
  };

  return (
    <PlayerContainer>
      <PlayerLeft>
        {currentlyPlaying ? (
          <>
            <AlbumCover
              onClick={() =>
                history.push(`/album/${currentlyPlaying?.album?.id}`)
              }
            >
              <img
                src={currentlyPlaying?.album?.images?.[2].url}
                alt={`${currentlyPlaying?.album?.name} Cover`}
              />
            </AlbumCover>

            <TrackInfo>
              <h3
                onClick={() =>
                  history.push(`/album/${currentlyPlaying?.album?.id}`)
                }
              >
                {currentlyPlaying?.name}
              </h3>
              <p
                onClick={() =>
                  history.push(`/artist/${currentlyPlaying?.artists?.[0].id}`)
                }
              >
                {currentlyPlaying?.artists?.[0].name}
              </p>
            </TrackInfo>
          </>
        ) : null}
      </PlayerLeft>

      <PlayerMid>
        <Shuffle
          className={shuffleState ? "active" : ""}
          onClick={handleShuffleState}
        />
        <SkipPrevious onClick={handlePrev} />
        {playingState ? (
          <PauseCircleOutline
            className="mid_button active"
            onClick={handlePlay}
          />
        ) : (
          <PlayCircleOutline
            className="mid_button active"
            onClick={handlePlay}
          />
        )}
        <SkipNext onClick={handleNext} />
        <Repeat
          className={`${repeatState === "context" ? "active" : ""}`}
          onClick={handleReplayState}
        />

        {/* {repeatState === "off" ? (
          <Repeat className="" onClick={handleSetRepeatAll} />
        ) : repeatState === "context" ? (
          <Repeat className="active" onClick={handleSetRepeatOne} />
        ) : repeatState === "track" ? (
          <RepeatOne className="active" onClick={handleSetRepeatOff} />
        ) : (
          <Repeat className="" />
        )} */}
      </PlayerMid>

      <PlayerRight>
        <Grid container spacing={2}>
          <Grid item>
            <LyricsModal lyricsObj={lyricsObj} />
          </Grid>
          <Grid item>
            <PlaylistPlay onClick={() => history.push("/queue")} />
          </Grid>

          <Grid item>
            {volume >= 60 ? (
              <VolumeUp onClick={handleVolumeMute} />
            ) : volume === 0 ? (
              <VolumeOff onClick={handleVolumeMute} />
            ) : (
              <VolumeDown onClick={handleVolumeMute} />
            )}
          </Grid>
          <Grid item xs>
            <Slider
              step={1}
              min={0}
              max={100}
              value={volume}
              onChange={handleVolume}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
      </PlayerRight>
    </PlayerContainer>
  );
};

const PlayerContainer = styled.div`
  /* border: 1px solid red; */

  position: fixed;
  display: flex;
  justify-content: space-between;
  background-color: #282828;
  width: 99%;
  bottom: 0;
  padding: 1rem;
`;

const PlayerLeft = styled.div`
  /* border: 1px solid red; */

  flex: 0.3;
  display: flex;
  align-items: center;
  width: 18rem;
  color: #fff;
`;

const AlbumCover = styled.div`
  > img {
    object-fit: contain;
    height: 64px;
    width: 64px;
    cursor: pointer;
  }
`;

const TrackInfo = styled.div`
  margin-left: 1rem;

  > h3 {
    margin: 0;
    margin-bottom: 0.25rem;
    cursor: pointer;
    font-size: 1.25rem;

    &:hover {
      text-decoration: underline;
    }
  }

  > p {
    margin: 0;
    color: gray;
    cursor: pointer;
    font-size: 0.85rem;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const PlayerMid = styled.div`
  /* border: 1px solid red; */

  flex: 0.4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 18rem;
  padding: 0 6rem;

  .MuiSvgIcon-root {
    cursor: pointer;
    color: #fff;
    font-size: 2rem;

    &:hover {
      color: #1ed15e;
    }
  }

  .active {
    color: #1ed15e;

    &:hover {
      color: #fff;
    }
  }

  .mid_button {
    font-size: 3rem;
  }
`;

const PlayerRight = styled.div`
  /* border: 1px solid red; */

  flex: 0.3;
  display: flex;
  align-items: center;
  max-width: 18rem;
  padding: 0 6rem;

  * .MuiSlider-root {
    color: #1ed15e;
  }

  .MuiSvgIcon-root {
    cursor: pointer;
    color: #fff;

    &:hover {
      color: #1ed15e;
    }
  }
`;

export default MusicPlayer;
