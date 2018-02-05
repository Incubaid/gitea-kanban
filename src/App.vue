<template>
  <div id="app">
    <section class="section container">
      <div class="row">
        <div class="col-md-3">
          <multiselect v-model="reposValue"
                       :options="reposOptions"
                       :multiple="true"
                       :close-on-select="false"
                       :clear-on-select="false"
                       :hide-selected="true"
                       :preserve-search="true"
                       placeholder="All Repos"
                       label="full_name"
                       track-by="full_name"
                       @input="updateIssues"
                       selectLabel="">
            <template slot="tag" slot-scope="props">
              <span class="custom__tag">
                <span>{{ props.option.full_name }}</span>
                <span class="custom__remove" @click="props.remove(props.option)">❌ </span>
              </span>
            </template>
          </multiselect>
        </div>
        <div class="col-md-3">
          <multiselect v-model="assigneesValue"
                       :options="assigneesOptions"
                       :multiple="true"
                       :close-on-select="false"
                       :clear-on-select="false"
                       :hide-selected="true"
                       :preserve-search="true"
                       placeholder="All Assignees"
                       label="name"
                       track-by="name"
                       @input="updateIssues"
                       selectLabel="">
            <template slot="tag" slot-scope="props">
              <span class="custom__tag">
                <span>{{ props.option.name }}</span>
                <span class="custom__remove" @click="props.remove(props.option)">❌ </span>
              </span>
            </template>
          </multiselect>
        </div>
        <div class="col-md-3">
          <multiselect v-model="labelsValue"
                       :options="labelsOptions"
                       :multiple="true"
                       :close-on-select="false"
                       :clear-on-select="false"
                       :hide-selected="true"
                       :preserve-search="true"
                       label="name"
                       track-by="name"
                       placeholder="All Labels"
                       @input="updateIssues"
                       selectLabel="">
            <template slot="tag" slot-scope="props">
              <span class="custom__tag">
                <span>{{ props.option.name}}</span>
                <span class="custom__remove" @click="props.remove(props.option)">❌ </span>
              </span>
            </template>
          </multiselect>
        </div>
        <div class="col-md-3">
          <multiselect v-model="milestonesValue"
                       :options="milestonesOptions"
                       :multiple="true"
                       :close-on-select="false"
                       :clear-on-select="false"
                       :hide-selected="true"
                       :preserve-search="true"
                       label="name"
                       track-by="name"
                       placeholder="All Milestones"
                       @input="updateIssues"
                       selectLabel="">
            <template slot="tag" slot-scope="props">
              <span class="custom__tag">
                <span>{{ props.option.name }}</span>
                <span class="custom__remove" @click="props.remove(props.option)">❌ </span>
              </span>
            </template>
          </multiselect>
        </div>
      </div>
    </section>
    <br/>
    <Kanban :stages="stages" :blocks="issues" @update-block="updateIssueStatus">
      <div v-for="issue in issues" :slot="issue.id" :key="issue.id">
        <div v-if="issue.assignee">
          <img class="avatar img-rounded" :src="issue.assignee.avatar_url" />
        </div>
        <div>
          <strong>{{ issue.name }}</strong>
        </div>
        <div class="issue-tag" v-if="issue.milestone">
          {{ issue.milestone }}
        </div>
        <!-- FIXME: add labels to issue payload -->
        <!-- <div v-for="label in issue.labels"
             :key="label.title"
             class="issue-tag"
             :style="{ backgroundColor: '#'+label.color}"
             v-if="!(label.name in stages)">
          <span>{{label.name}}</span>
        </div><br/> -->
        <div class="text-right">
          <a class="badge badge-secondary" :href="issue.url" target="_blank">
            <span class="glyphicon glyphicon-link"></span>
          </a>
        </div>
      </div>
    </Kanban>
  </div>
</template>

<script>
import _ from 'lodash';
import Multiselect from 'vue-multiselect';
import * as randomColor from 'randomcolor';
import http from './http-common';
import Kanban from './components/Kanban';
import GITEA_API from './config';

export default {
  name: 'app',
  components: {
    Kanban,
    Multiselect,
  },
  data() {
    return {
      stages: {
        backlog: 'backlog', // labelName: representation values
      },
      issues: [], // Show issues on board
      allIssues: [], // All issues user can access
      reposValue: [],
      reposOptions: [],
      milestonesValue: [],
      milestonesOptions: [],
      labelsValue: [],
      labelsOptions: [],
      assigneesValue: [],
      assigneesOptions: [],
      repoLabels: {}, // example: {sample-repo: LabelObject}, used to add/remove labels
      pages: {}, // example: {stage: <pageCount>}
    };
  },
  created() {
    this.token = '5ded18e4deb727f4cc5913ab837db5a1e5826192';
    this.initKanban();
    this.$on('loadmore', (stage) => {
      let args;
      if (stage === 'done') {
        args = 'closed=true';
      } else if (stage === 'backlog') {
        const stages = _.chain(this.stages)
          /* eslint-disable no-unused-vars */
          .filter(stag => stag !== 'done' && stag !== 'backlog')
          .map((key, val) => key)
          .value();
        args = `stages=${_.join(stages)}`;
      } else {
        args = `state=${stage}`;
      }

      this.fetchIssues(args, this.pages[stage] + 1);
      this.pages[stage] = this.pages[stage] + 1;
    });
  },
  methods: {
    initKanban() {
      // add assignees to url
      const stagesQuery = this.$route.query.stages;
      if (!_.isEmpty(stagesQuery)) {
        // stages query will be like: Stage1:state_stage1,Stage2:state_stage2,
        // so the first part (Stage1) is the column name which will be visible
        // and the second part (state_stage1) is the gitea label name
        const stagesParts = _.split([stagesQuery], ',');
        _.forEach(stagesParts, (stagePart) => {
          if (stagePart.includes(':')) {
            const mappedParts = stagePart.split(':');
            this.stages[mappedParts[0]] = mappedParts[1];
          } else {
            this.stages[stagePart] = stagePart;
          }
        });
      } else {
        this.updateUrl({ stages: _.join(this.stages) });
      }
      this.stages.done = 'done';

      this.pages = _.zipObject(
        _.keys(this.stages),
        _.times(_.keys(this.stages).length, _.constant(1)),
      );

      http.request
        .get(`kanban/filters?token=${this.token}`)
        .then((fitlerResponse) => {
          this.initFilters(fitlerResponse.data);

          const stages = _.chain(this.stages)
            /* eslint-disable no-unused-vars */
            .filter(stage => stage !== 'done' && stage !== 'backlog')
            .map((key, val) => key)
            .value();

          // Get stages issues
          _.forEach(stages, (stage) => {
            this.fetchIssues(`state=${stage}`);
          });
          this.fetchIssues(`stages=${_.join(stages)}`);
          this.fetchIssues('closed=true');
          this.updateIssues();
        });
    },
    initFilters(filtersPayload) {
      this.reposOptions = filtersPayload.repositories;
      this.assigneesOptions = filtersPayload.assignees;
      this.labelsOptions = filtersPayload.labels;
      this.milestonesOptions = filtersPayload.milestones;

      // update assignee filters
      const assigneesQuery = _.split(this.$route.query.assignees);
      if (!_.isEmpty(assigneesQuery)) {
        this.assigneesValue = _.filter(this.assigneesOptions, assignee =>
          _.includes(assigneesQuery, assignee.name),
        );
      }

      // update milestone filters
      const milestonesQuery = _.split(this.$route.query.milestones);
      if (!_.isEmpty(milestonesQuery)) {
        this.milestonesValue = _.filter(this.milestonesOptions, milestone =>
          _.includes(milestonesQuery, milestone.name),
        );
      }
      // update label filters
      const labelsQuery = _.split(this.$route.query.labels);
      if (!_.isEmpty(labelsQuery)) {
        this.labelsValue = _.filter(this.labelsOptions, label =>
          _.includes(labelsQuery, label.name),
        );
      }

      // update repo filters
      const reposQuery = _.split(this.$route.query.repos);
      if (!_.isEmpty(reposQuery)) {
        this.reposValue = _.filter(this.reposOptions, repo =>
          _.includes(reposQuery, repo.full_name),
        );
      }
    },
    fetchIssues(args, page = 1) {
      http.request
        .get(`kanban/issues?token=${this.token}&${args}&page=${page}`)
        .then((issuesResponse) => {
          /* eslint-disable no-param-reassign */
          _.forEach(issuesResponse.data, (issue) => {
            issue.repo_fullname = _.find(this.reposOptions, {
              id: _.parseInt(issue.repo_id),
            }).full_name;
            issue.url = `${GITEA_API}/${issue.repo_fullname}/issues/${
              issue.index
            }`;

            // Set repo and status on all issues
            const labelObj = _.find(this.labelsOptions, option =>
              _.includes(issue.label_ids, option.id),
            );

            if (_.isEmpty(this.repoLabels[issue.repo_fullname])) {
              this.initRepoLabels(issue.repo_fullname);
            }
            // add status field to issues
            if (issue.closed === false) {
              if (labelObj && _.includes(this.stages, labelObj.name)) {
                issue.status = this.stages[labelObj.name];
              } else {
                issue.status = 'backlog';
              }
            } else {
              issue.status = 'done';
            }
            this.allIssues.push(issue);
          });
        });
    },
    initRepoLabels(repoFullname) {
      // Get labels of each repo and add it to labelsOptions
      const labelsUrl = `/repos/${repoFullname}/labels?token=${this.token}`;
      http.request.get(labelsUrl).then((labelsResponse) => {
        this.repoLabels[repoFullname] = labelsResponse.data;
        this.labelsOptions = _.uniqBy(
          _.union(this.labelsOptions, labelsResponse.data),
          'name',
        );
      });
    },
    updateIssues() {
      // update list view of issues based on filters selected
      this.issues = this.allIssues;
      // update issues based on the repo filter if provided
      if (this.reposValue.length > 0) {
        this.issues = _.filter(this.issues, issue =>
          _.some(this.reposValue, { id: _.parseInt(issue.repo_id) }),
        );
      }
      this.updateUrl({ repos: _.map(this.reposValue, 'full_name').join() });

      // update issues based on the assignee filter if provided
      if (this.assigneesValue.length > 0) {
        this.issues = _.filter(this.issues, (issue) => {
          const assigned = !_.isEmpty(issue.assignee);
          return (
            assigned && _.some(this.assigneesValue, { name: issue.assignee })
          );
        });
      }
      // add assignees to url
      this.updateUrl({
        assignees: _.map(this.assigneesValue, 'name').join(),
      });

      // update issues based on the label filter if provided
      if (this.labelsValue.length > 0) {
        this.issues = _.filter(this.issues, issue =>
          _.some(this.labelsValue, option =>
            _.includes(issue.label_ids, option.id),
          ),
        );
      }
      // add labels to url
      this.updateUrl({ labels: _.map(this.labelsValue, 'name').join() });

      // update issues based on the milestones filter if provided
      if (this.milestonesValue.length > 0) {
        this.issues = _.filter(
          this.issues,
          issue =>
            !_.isEmpty(issue.milestone) &&
            _.some(this.milestonesValue, { name: issue.milestone }),
        );
      }

      this.updateUrl({
        milestones: _.map(this.milestonesValue, 'name').join(),
      });
      // add milestones to url
    },
    updateIssueStatus(id, status) {
      const statusLabel = _.findKey(this.stages, s => s === status);
      const issue = _.find(this.issues, { id: Number(id) });
      const oldStatus = _.findKey(this.stages, s => s === issue.status);
      issue.status = status;

      // Map the kanban column status to gitea status

      const url = `/repos/${issue.repo_fullname}/issues/${issue.index}`;
      if (oldStatus !== 'backlog' && oldStatus !== 'done') {
        const oldLabelID = _.find(this.repoLabels[issue.repo_fullname], {
          name: oldStatus,
        }).id;
        const deleteUrl = `${url}/labels/${oldLabelID}?token=${this.token}`;
        http.request.delete(deleteUrl).then();
      }

      // Close if issue was moved to
      if (statusLabel === 'done') {
        const doneUrl = `${url}?token=${this.token}`;
        http.request.patch(doneUrl, { state: 'closed' }).then();
        return;
      }

      // Open if it was in done
      if (oldStatus === 'done') {
        const doneUrl = `${url}?token=${this.token}`;
        http.request.patch(doneUrl, { state: 'open' }).then();
      }

      // Add label of new state if it was not backlog
      if (statusLabel !== 'backlog') {
        const foundLabel = _.find(this.repoLabels[issue.repo_fullname], {
          name: statusLabel,
        });
        if (!foundLabel) {
          const createLabelUrl = `/repos/${issue.repo_fullname}/labels?token=${
            this.token
          }`;
          http.request
            .post(createLabelUrl, { color: randomColor(), name: statusLabel })
            .then((response) => {
              const label = response.data;
              this.repoLabels[issue.repo_fullname].push(label);
              const addLabelUrl = `${url}/labels?token=${this.token}`;
              http.request.post(addLabelUrl, { labels: [label.id] }).then();
            });
        } else {
          const label = _.find(this.repoLabels[issue.repo_fullname], {
            name: statusLabel,
          });
          const addLabelUrl = `${url}/labels?token=${this.token}`;
          http.request.post(addLabelUrl, { labels: [label.id] }).then();
        }
      }
    },
    updateUrl(queryObject) {
      this.$router.push({
        query: Object.assign({}, this.$route.query, queryObject),
      });
    },
  },
};
</script>

<style lang="scss">
@import './assets/kanban.scss';

* {
  box-sizing: border-box;
}

body {
  background: #33363d;
  -webkit-font-smoothing: antialiased;
}

.section {
  padding: 20px;
  text-align: center;
}
</style>

<style>
@import './assets/vue-multiselect.min.css';

.avatar {
  width: 30px;
  height: 30px;
  float: right;
}

.icon {
  width: 24px;
  height: 24px;
  float: right;
}

.issue-tag {
  border-radius: 2px;
  cursor: default;
  padding: 0 2px;
  font-size: 12px;
  display: inline-block;
  line-height: 14px;
  border: 1px solid #6c6c6c;
  max-width: 100%;
  margin: 1px 0 0 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loader {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  width: 150px;
  height: 150px;
  margin: -75px 0 0 -75px;
  border: 16px solid #f3f3f3;
  border-radius: 50%;
  border-top: 16px solid #3498db;
  width: 120px;
  height: 120px;
  -webkit-animation: spin 2s linear infinite;
  animation: spin 2s linear infinite;
}

@-webkit-keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
