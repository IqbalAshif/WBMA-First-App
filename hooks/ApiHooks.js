import axios from 'axios';
import {useState, useEffect, useContext} from 'react';
import {MainContext} from '../contexts/MainContext';
import {apiUrl, appIdentifier} from '../utils/variables';

// general function for fetching (options default value is empty object)
const doFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  const json = await response.json();
  if (json.error) {
    // if API response contains error message (use Postman to get further details)
    throw new Error(json.message + ': ' + json.error);
  } else if (!response.ok) {
    // if API response does not contain error message, but there is some other error
    throw new Error('doFetch failed');
  } else {
    // if all goes well
    return json;
  }
};
const useLoadMedia = (myFilesOnly, userId) => {
  const [mediaArray, setMediaArray] = useState([]);
  const {update} = useContext(MainContext);
  const loadMedia = async () => {
    try {
      const listJson = await doFetch(apiUrl + 'tags/' + appIdentifier);

      let media = await Promise.all(
        listJson.map(async (item) => {
          const fileJson = await doFetch(apiUrl + 'media/' + item.file_id);
          return fileJson;
        })
      );

      if (myFilesOnly) {
        media = media.filter((item) => item.user_id === userId);
      }

      setMediaArray(media);
    } catch (error) {
      console.error('loadMedia error', error.message);
    }
  };
  // TODO: move useEffect here
  useEffect(() => {
    loadMedia();
  }, [update]);

  return mediaArray;
};
const useLogin = () => {
  const postLogin = async (userCredentials) => {
    const options = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(userCredentials),
    };
    try {
      const userData = await doFetch(apiUrl + 'login', options);
      return userData;
    } catch (error) {
      throw new Error('postLogin error: ' + error.message);
    }
  };
  return {postLogin};
};

const useUser = () => {
  const postRegister = async (inputs) => {
    console.log('trying to create user', inputs);
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputs),
    };
    try {
      const json = await doFetch(apiUrl + 'users', fetchOptions);
      console.log('register resp', json);
      return json;
    } catch (e) {
      throw new Error(e.message);
    }
  };

  const checkToken = async (token) => {
    try {
      const options = {
        method: 'GET',
        headers: {'x-access-token': token},
      };
      const userData = await doFetch(apiUrl + 'users/user', options);
      return userData;
    } catch (error) {
      throw new Error(error.message);
    }
  };
  const checkIfUserIsAvailable = async (username) => {
    try {
      const result = await doFetch(apiUrl + 'users/username/' + username);
      return result.available;
    } catch (error) {
      throw new Error('apiHooks checkIfUserIsAvailable', error.message);
    }
  };
  const getUserById = async (id, token) => {
    try {
      const options = {
        headers: {
          method: 'GET',
          'x-access-token': token,
        },
      };

      const userData = await doFetch(apiUrl + 'users/' + id, options);
      return userData;
    } catch (e) {
      throw new Error(e.message);
    }
  };

  return {postRegister, checkToken, checkIfUserIsAvailable, getUserById};
};

const useTag = () => {
  const getFilesByTag = async (tag) => {
    try {
      const tagList = await doFetch(apiUrl + 'tags/' + tag);
      return tagList;
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const postTag = async (tag, token) => {
    const options = {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'x-access-token': token},
      body: JSON.stringify(tag),
    };
    try {
      const result = await doFetch(apiUrl + 'tags', options);
      return result;
    } catch (error) {
      throw new Error('postTag error: ' + error.message);
    }
  };
  return {getFilesByTag, postTag};
};

const useMedia = () => {
  const upload = async (fd, token) => {
    const options = {
      method: 'POST',
      headers: {'x-access-token': token},
      data: fd,
      url: apiUrl + 'media',
    };
    try {
      const response = await axios(options);
      return response.data;
    } catch (e) {
      throw new Error(e.message);
    }
  };

  const updateFile = async (fileId, fileInfo, token) => {
    const options = {
      method: 'PUT',
      headers: {
        'x-access-token': token,
        'Content-type': 'application/json',
      },
      body: JSON.stringify(fileInfo),
    };
    try {
      const result = await doFetch(apiUrl + 'media/' + fileId, options);
      return result;
    } catch (e) {
      throw new Error('updateFileError', e.message);
    }
  };

  const deleteFile = async (fileId, token) => {
    const options = {
      method: 'DELETE',
      headers: {'x-access-token': token},
    };
    try {
      const result = await doFetch(apiUrl + 'media/' + fileId, options);
      return result;
    } catch (e) {
      throw new Error('deleteFileError', e.message);
    }
  };

  return {upload, updateFile, deleteFile};
};

export {useLoadMedia, useLogin, useUser, useTag, useMedia};
