// npm modules
const fetch = require('node-fetch');
const cmp = require('semver-compare');

// our modules
const docker = require('../docker/docker');
const pkg = require('../../package.json');

// urls for tags request
const exoServerUrl = `https://api.github.com/repos/exoframejs/exoframe-server/releases`;
const traefikUrl = 'https://api.github.com/repos/containous/traefik/releases';

const getLatestVersion = async url => {
  const res = await fetch(url).then(r => r.json());
  const latestRelease = res.filter(r => !r.draft && !r.prerelease).shift();
  return latestRelease.tag_name;
};

module.exports = server => {
  server.route({
    method: 'GET',
    path: '/version',
    config: {
      auth: 'token',
    },
    async handler(request, reply) {
      // get version of traefik
      const allImages = await docker.listImages();
      const traefik = allImages.find(img => img.RepoTags && img.RepoTags.find(t => t.includes('traefik')));
      const traefikVersion = traefik.Labels['org.label-schema.version'];
      // get latest versions
      const lastServerTag = await getLatestVersion(exoServerUrl);
      const lastTraefikTag = await getLatestVersion(traefikUrl);
      // reply
      reply({
        server: pkg.version,
        latestServer: lastServerTag,
        serverUpdate: cmp(lastServerTag, pkg.version) > 0,
        traefik: traefikVersion,
        latestTraefik: lastTraefikTag,
        traefikUpdate: cmp(lastTraefikTag, traefikVersion) > 0,
      }).code(200);
    },
  });
};
