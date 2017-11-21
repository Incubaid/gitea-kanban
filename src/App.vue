<template>
  <div id="app">
    <section class="section container">
      <div class="row">
        <div class="col-md-3">
          <multiselect v-model="reposValue" :options="reposOptions" :multiple="true" :close-on-select="false" :clear-on-select="false" :hide-selected="true" :preserve-search="true" placeholder="All Repos" label="full_name" track-by="full_name" @input="updateIssues" selectLabel="">
            <template slot="tag" slot-scope="props">
              <span class="custom__tag">
                <span>{{ props.option.full_name }}</span>
                <span class="custom__remove" @click="props.remove(props.option)">❌ </span>
              </span>
            </template>
          </multiselect>
        </div>
        <div class="col-md-3">
          <multiselect v-model="assigneesValue" :options="assigneesOptions" :multiple="true" :close-on-select="false" :clear-on-select="false" :hide-selected="true" :preserve-search="true" placeholder="All Assignees" label="login" track-by="login" @input="updateIssues" selectLabel="">
            <template slot="tag" slot-scope="props">
              <span class="custom__tag">
                <span>{{ props.option.login }}</span>
                <span class="custom__remove" @click="props.remove(props.option)">❌ </span>
              </span>
            </template>
          </multiselect>
        </div>
        <div class="col-md-3">
          <multiselect v-model="labelsValue" :options="labelsOptions" :multiple="true" :close-on-select="false" :clear-on-select="false" :hide-selected="true" :preserve-search="true" label="name" track-by="name" placeholder="All Labels" @input="updateIssues" selectLabel="">
            <template slot="tag" slot-scope="props">
              <span class="custom__tag">
                <span>{{ props.option.name}}</span>
                <span class="custom__remove" @click="props.remove(props.option)">❌ </span>
              </span>
            </template>
          </multiselect>
        </div>
        <div class="col-md-3">
          <multiselect v-model="milestonesValue" :options="milestonesOptions" :multiple="true" :close-on-select="false" :clear-on-select="false" :hide-selected="true" :preserve-search="true" label="title" track-by="title" placeholder="All Milestones" @input="updateIssues" selectLabel="">
            <template slot="tag" slot-scope="props">
              <span class="custom__tag">
                <span>{{ props.option.title }}</span>
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
        <modal :name="String(issue.id)" :resizable="true" :draggable="true" :scrollable="true">
          <div class="container" style="background-color:grey">
            <div class="row">
              <div class="col-md-9">
                <div class="card-item-header">
                  <a :href="'http://localhost:3000/' + issue.user.login">{{issue.user.login}}</a>
                  <span> opened this issue on: {{issue.created_at}}</span>
                </div>
                <div class="card-item-body">
                  {{ issue.body }}
                </div>
              </div>
              <div class="col-md-3">

              </div>
            </div>
          </div>
        </modal>
        <div v-if="issue.assignee">
          <a href="javascript:void(0)">
            <span class="badge badge-secondary" v-on:click="showModal(issue.id)">#{{issue.id}}</span>
          </a>
          <img class="avatar img-rounded" :src="issue.assignee.avatar_url" />
        </div>
        <div>
          <strong>{{ issue.title }}</strong>
        </div>
        <div class="issue-tag" v-if="issue.assignee">
          {{ issue.milestone.title }}
          1.1.0
        </div>
        <div v-for="label in issue.labels" :key="label.title" class="issue-tag" :style="{ backgroundColor: '#'+label.color}" v-if="!stages.includes(label.name)">
          <span>{{label.name}}</span>
        </div><br/>
        <div class="text-right">
          <a class="badge badge-secondary" :href="issue.url.replace('/api/v1/repos', '')" target="_blank">
            <span class="glyphicon glyphicon-link"></span>
          </a>
          <a href="javascript:void(0)">
            <span class="badge badge-secondary" v-on:click="showModal(issue.id)">
              <span class="glyphicon glyphicon-comment"> {{issue.comments}}</span>
            </span>
          </a>
        </div>

      </div>
    </Kanban>
  </div>
</template>

<script>
import _ from 'lodash';
import Multiselect from 'vue-multiselect';
import VModal from 'vue-js-modal';
import http from './http-common';
import Kanban from './components/Kanban';

export default {
  name: 'app',
  components: {
    Kanban,
    Multiselect,
    VModal,
  },
  data() {
    return {
      stages: ['backlog', 'in-progress', 'question', 'validation', 'done'],
      issues: [], // Show issues on board
      allIssues: [], // All issues user can access
      token: 'f48b0e812b76f52e36cc04178308ad8c763f40f2',
      reposValue: [],
      reposOptions: [],
      milestonesValue: [],
      milestonesOptions: [],
      labelsValue: [],
      labelsOptions: [],
      assigneesValue: [],
      assigneesOptions: [],
    };
  },
  created() {
    const reposUrl = `/repos/search?token=${this.token}&uid=2`;
    // const reposUrl = `/repos/search?token=${this.token}&uid=2`;
    // const reposUrl = `/repos/search?token=${this.token}&uid=2`;
    http.request.get(reposUrl).then(
      (response) => {
        this.reposOptions = response.data.data;

        _.forEach(this.reposOptions, (repo) => {
          // Get milestones for each repo and add it to milestonesOptions
          const milestonesUrl = `/repos/${repo.full_name}/milestones?token=${this.token}`;
          http.request.get(milestonesUrl).then(
            (milestonesResponse) => {
              _.forEach(milestonesResponse.data, (milestone) => {
                if (!_.find(this.milestonesOptions, { title: milestone.title })) {
                  this.milestonesOptions.push(milestone);
                }
              });
            });

          // Get collaborators for each repo and add it to assigneesOptions
          const collaboratorsUrl = `/repos/${repo.full_name}/collaborators?token=${this.token}`;
          http.request.get(collaboratorsUrl).then(
            (collaboratorsResponse) => {
              collaboratorsResponse.data.push(repo.owner);
              _.forEach(collaboratorsResponse.data, (collaborator) => {
                if (!_.find(this.assigneesOptions, { id: collaborator.id })) {
                  this.assigneesOptions.push(collaborator);
                }
              });
            });

          // Get labels of each repo and add it to labelsOptions
          const labelsUrl = `/repos/${repo.full_name}/labels?token=${this.token}`;
          http.request.get(labelsUrl).then(
            (labelsResponse) => {
              _.forEach(labelsResponse.data, (label) => {
                if (!_.find(this.labelsOptions, { title: label.title })) {
                  this.labelsOptions.push(label);
                }
              });
            });

          // Get issues of each repo and add it to issuesOptions
          const issuesUrl = `/repos/${repo.full_name}/issues?token=${this.token}`;
          http.request.get(issuesUrl).then(
            (issuesResponse) => {
              /* eslint-disable no-param-reassign */
              _.forEach(issuesResponse.data, (issue) => {
                // Set repo and status on all issues
                issue.repo = repo;
                const labelObj = _.find(issue.labels, label => _.includes(this.stages, label.name));
                if (labelObj) {
                  issue.status = labelObj.name;
                } else {
                  issue.status = 'backlog';
                }
                this.allIssues.push(issue);
              });
              // Update the issues
              this.updateIssues();
            });
        });
      });
  },
  methods: {
    updateIssues() {
      // update list view of issues based on filters selected
      this.issues = this.allIssues;

      // update issues based on the repo filter if provided
      if (this.reposValue.length > 0) {
        this.issues = _.filter(this.issues, issue => _.some(this.reposValue, issue.repo));
      }

      // update issues based on the assignee filter if provided
      if (this.assigneesValue.length > 0) {
        this.issues = _.filter(this.issues, (issue) => {
          const assigned = !_.isEmpty(issue.assignee);
          return assigned && _.some(this.assigneesValue, issue.assignee);
        });
      }

      // update issues based on the label filter if provided
      if (this.labelsValue.length > 0) {
        this.issues = _.filter(this.issues, issue =>
          !_.isEmpty(_.intersectionBy(this.labelsValue, issue.labels, 'id')),
        );
      }

      // update issues based on the milestones filter if provided
      if (this.milestonesValue.length > 0) {
        this.issues = _.filter(this.issues, issue =>
          !_.isEmpty(issue.milestone) && _.some(this.milestonesValue, issue.milestone),
        );
      }
    },
    updateIssueStatus(id, status) {
      const issue = this.issues.find(b => b.id === Number(id));
      issue.status = status;
      const url = `/kanban/issues/${issue.id}?token=${this.token}`;
      http.request.post(url, { status, token: this.token });
    },
    showModal(issueId) {
      this.$modal.show(String(issueId));
    },
  },
};
</script>

<style lang="scss">
@import './assets/kanban.scss';


$backlog: Grey;
$in-progress: #2A92BF;
$question: #D2B8A1;
$validation: #00B961;
$done: green;

* {
  box-sizing: border-box;
}

body {
  background: #33363D;
  -webkit-font-smoothing: antialiased;
}

.drag-column {
  &-backlog {
    .drag-column-header,
    .is-moved,
    .drag-options {
      background: $backlog;
    }
  }

  &-in-progress {
    .drag-column-header,
    .is-moved,
    .drag-options {
      background: $in-progress;
    }
  }

  &-question {
    .drag-column-header,
    .is-moved,
    .drag-options {
      background: $question;
    }
  }

  &-validation {
    .drag-column-header,
    .is-moved,
    .drag-options {
      background: $validation;
    }
  }

  &-done {
    .drag-column-header,
    .is-moved,
    .drag-options {
      background: $done;
    }
  }
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
  float: left;
}
</style>
