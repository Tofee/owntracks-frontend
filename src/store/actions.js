import * as types from "@/store/mutation-types";
import * as api from "@/api";
import { isIsoDate } from "@/util";

/**
 * Populate the state from URL query parameters.
 *
 * @param {Object} query URL query parameters
 */
const populateStateFromQuery = ({ state, commit }, query) => {
  if (query.lat && !isNaN(parseFloat(query.lat))) {
    commit(types.SET_MAP_CENTER, {
      lat: query.lat,
      lng: parseFloat(state.map.center.lng),
    });
  }
  if (query.lng && !isNaN(parseFloat(query.lng))) {
    commit(types.SET_MAP_CENTER, {
      lat: parseFloat(state.map.center.lat),
      lng: query.lng,
    });
  }
  if (query.zoom && !isNaN(parseInt(query.zoom))) {
    commit(types.SET_MAP_ZOOM, parseInt(query.zoom));
  }
  if (query.start && isIsoDate(query.start)) {
    commit(types.SET_START_DATE, new Date(query.start));
  }
  if (query.end && isIsoDate(query.end)) {
    commit(types.SET_END_DATE, new Date(query.end));
  }
  if (query.user) {
    commit(types.SET_SELECTED_USER, query.user);
  }
  if (query.device) {
    commit(types.SET_SELECTED_DEVICE, query.device);
  }
  if (query.layers) {
    const activeLayers = query.layers.split(",");
    Object.keys(state.map.layers).forEach(layer => {
      const visibility = activeLayers.includes(layer);
      if (state.map.layers[layer] !== visibility) {
        commit(types.SET_MAP_LAYER_VISIBILITY, { layer, visibility });
      }
    });
  }
};

/**
 * Trigger loading of all required data: users, devices, last locations,
 * location history, version and initiate WebSocket connection.
 */
const loadData = async ({ dispatch }) => {
  await dispatch("getUsers");
  await dispatch("getDevices");
  await dispatch("getLastLocations");
  await dispatch("getLocationHistory");
  await dispatch("getRecorderVersion");
  await dispatch("connectWebsocket");
};

/**
 * Connect to WebSocket to receive live location updates. When an update is
 * received, reload last locations and location history.
 */
const connectWebsocket = async ({ dispatch }) => {
  api.connectWebsocket(async () => {
    await dispatch("getLastLocations");
    // Reloading the complete location history is necessary because the
    // last locations do lack some of the detailed information.
    // TODO: make this optional via config.
    await dispatch("getLocationHistory");
  });
};

/**
 * Load user names.
 */
const getUsers = async ({ commit }) => {
  commit(types.SET_USERS, await api.getUsers());
};

/**
 * Load devices names of all users.
 */
const getDevices = async ({ commit, state }) => {
  commit(types.SET_DEVICES, await api.getDevices(state.users));
};

/**
 * Load last location of the selected user/device.
 */
const getLastLocations = async ({ commit, state }) => {
  commit(
    types.SET_LAST_LOCATIONS,
    await api.getLastLocations(state.selectedUser, state.selectedDevice)
  );
};

/**
 * Load location history of all devices, in the selected date range.
 */
const getLocationHistory = async ({ commit, state }) => {
  let devices;
  if (state.selectedUser) {
    if (state.selectedDevice) {
      devices = { [state.selectedUser]: [state.selectedDevice] };
    } else {
      devices = { [state.selectedUser]: state.devices[state.selectedUser] };
    }
  } else {
    devices = state.devices;
  }
  commit(
    types.SET_LOCATION_HISTORY,
    await api.getLocationHistory(devices, state.startDate, state.endDate)
  );
};

/**
 * Load the OwnTracks recorder version.
 */
const getRecorderVersion = async ({ commit }) => {
  commit(types.SET_RECORDER_VERSION, await api.getVersion());
};

/**
 * Set the selected user and reload the location history.
 *
 * @param {string} user Name of the new selected user
 */
const setSelectedUser = async ({ commit, dispatch }, user) => {
  commit(types.SET_SELECTED_USER, user);
  await dispatch("getLocationHistory");
  await dispatch("getLastLocations");
};

/**
 * Set the selected device and reload the location history.
 *
 * @param {string} device Name of the new selected device
 */
const setSelectedDevice = async ({ commit, dispatch }, device) => {
  commit(types.SET_SELECTED_DEVICE, device);
  await dispatch("getLocationHistory");
  await dispatch("getLastLocations");
};

/**
 * Set the start date for loading data and reload the location history.
 *
 * @param {Date} startDate Start date for loading data
 */
const setStartDate = async ({ commit, dispatch }, startDate) => {
  commit(types.SET_START_DATE, startDate);
  await dispatch("getLocationHistory");
  await dispatch("getLastLocations");
};

/**
 * Set the end date for loading data and reload the location history.
 *
 * @param {Date} endDate End date for loading data
 */
const setEndDate = async ({ commit, dispatch }, endDate) => {
  commit(types.SET_END_DATE, endDate);
  await dispatch("getLocationHistory");
  await dispatch("getLastLocations");
};

export default {
  populateStateFromQuery,
  loadData,
  connectWebsocket,
  getUsers,
  getDevices,
  getLastLocations,
  getLocationHistory,
  getRecorderVersion,
  setSelectedUser,
  setSelectedDevice,
  setStartDate,
  setEndDate,
};
