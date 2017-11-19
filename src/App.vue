<template>
  <div id="app">
    <section class="section container">
      <div class="row">
        <div class="col-md-3">
          <multiselect v-model="reposValue" :options="reposOptions" :multiple="true" :close-on-select="false" :clear-on-select="false" :hide-selected="true" :preserve-search="true" placeholder="All Repos" label="name" track-by="name" @input="updateIssues" selectLabel="">
            <template slot="tag" slot-scope="props">
              <span class="custom__tag">
                <span>{{ props.option.name }}</span>
                <span class="custom__remove" @click="props.remove(props.option)">❌ </span>
              </span>
            </template>
          </multiselect>
        </div>
        <div class="col-md-3">
          <multiselect v-model="assigneesValue" :options="assigneesOptions" :multiple="true" :close-on-select="false" :clear-on-select="false" :hide-selected="true" :preserve-search="true" placeholder="All Assignees" label="name" track-by="name" @input="updateIssues" selectLabel="">
            <template slot="tag" slot-scope="props">
              <span class="custom__tag">
                <span>{{ props.option.name }}</span>
                <span class="custom__remove" @click="props.remove(props.option)">❌ </span>
              </span>
            </template>
          </multiselect>
        </div>
        <div class="col-md-3">
          <multiselect v-model="milestonesValue" :options="milestonesOptions" :multiple="true" :close-on-select="false" :clear-on-select="false" :hide-selected="true" :preserve-search="true" placeholder="All Labels" @input="updateIssues" selectLabel="">
            <template slot="tag" slot-scope="props">
              <span class="custom__tag">
                <span>{{ props.option}}</span>
                <span class="custom__remove" @click="props.remove(props.option)">❌ </span>
              </span>
            </template>
          </multiselect>
        </div>
        <div class="col-md-3">
          <multiselect v-model="labelsValue" :options="labelsOptions" :multiple="true" :close-on-select="false" :clear-on-select="false" :hide-selected="true" :preserve-search="true" placeholder="All Milestones" @input="updateIssues" selectLabel="">
            <template slot="tag" slot-scope="props">
              <span class="custom__tag">
                <span>{{ props.option }}</span>
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
        <div>
          <a href="javascript:void(0)">
            <span class="badge badge-secondary" v-on:click="showModal(issue.id)">#{{issue.id}}</span>
          </a>
          <img class="avatar img-rounded" :src="issue.assignee.avatar_url" />
        </div>
        <div>
          <strong>{{ issue.title }}</strong>
        </div>
        <div class="issue-tag">
          {{ issue.milestone.title }}
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
      token: '670b1d21f0616df5ea5cd844eabe6dc5305c1654',
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
    const url = `/kanban?token=${this.token}`;
    http.request.get(url).then(
      (response) => {
        this.reposOptions = response.data.repos;
        this.labelsOptions = response.data.labels;
        this.milestonesOptions = response.data.milestones;
        this.assigneesOptions = response.data.assignees;
        this.allIssues = response.data.issues;

        // Set repo_id and status on all issues
        for (let i = 0; i < this.allIssues.length; i += 1) {
          // TODO: add cleaner way to get issue repo
          const repoName = this.allIssues[i].url.split('/api/v1/repos/')[1].split('/')[1];
          this.allIssues[i].repo = this.reposOptions.find(repo => repo.name === repoName);

          // Set Labels
          const labels = this.allIssues[i].labels;
          for (let j = 0; j < labels.length; j += 1) {
            this.allIssues[i].status = 'backlog';
            if (this.stages.includes(labels[j].name)) {
              this.allIssues[i].status = labels[j].name;
              break;
            }
          }
        }

        this.updateIssues();
      });
  },
  methods: {
    updateIssues() {
      // update list view of issues based on filters selected
      this.issues = this.allIssues;
      if (this.reposValue.length > 0) {
        this.issues = this.issues.filter(
          iss => this.reposValue.map(r => r.id).includes(iss.repo.id),
        );
      }
      if (this.assigneesValue.length > 0) {
        this.issues = this.issues.filter(
          iss => this.assigneesValue.map(a => a.id).includes(iss.assignee.id),
        );
      }
      if (this.labelsValue.length > 0) {
        this.issues = this.issues.filter(
          iss => iss.labels.map(l => l.name).some(l => this.labelsValue.includes(l)),
        );
      }
      if (this.milestonesValue.length > 0) {
        this.issues = this.issues.filter(
          iss => this.milestonesValue.includes(iss.milestone.title),
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
