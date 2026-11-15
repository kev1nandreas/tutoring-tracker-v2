// CI/CD - Tutoring Tracker Backend Deploy (mirror of .github/workflows/be-main-deploy.yml)
// Jenkins runs on the same VPS and talks to the host Docker via docker.sock,
// so no SSH step is needed.
//
// Required Jenkins credential:
//   id: tutoring-tracker-v2-be-env   type: Secret file   (content = backend .env)
pipeline {
  agent any

  environment {
    // Unique compose project for this app. Must NOT be 'backend': other stacks
    // on this VPS (eztest) already use that project and share its db/mongo services.
    COMPOSE_PROJECT_NAME = 'tutoring-tracker-v2'
    SERVICE              = 'backend'
    ENV_CRED_ID          = 'tutoring-tracker-v2-be-env'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  triggers {
    githubPush()
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Deploy') {
      // same as workflow: only main, only when backend/** or the pipeline changed
      when {
        allOf {
          // plain Pipeline job (not Multibranch): BRANCH_NAME is unset, use GIT_BRANCH
          expression { env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' }
          anyOf {
            changeset 'backend/**'
            changeset 'Jenkinsfile'
            triggeredBy 'UserIdCause' // manual "Build Now" always deploys
          }
        }
      }
      steps {
        dir('backend') {
          withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
            sh '''
              set -e

              # compose reads .env from project dir for ${VAR} interpolation
              cp "$ENV_FILE" .env
              APP_NAME=$(grep -E '^APP_NAME=' .env | head -n1 | cut -d= -f2- | tr -d '"\\r')

              # first run: create db/mongo only if their containers don't exist yet.
              # Existing ones are never touched (keeps data, no recreate).
              for svc in db mongo; do
                case $svc in
                  db)    NAME="dockerPostgres-$APP_NAME" ;;
                  mongo) NAME="dockerMongo-$APP_NAME" ;;
                esac
                if [ -z "$(docker ps -aq -f "name=^${NAME}$")" ]; then
                  echo "$NAME missing -> creating"
                  docker compose up -d --no-recreate $svc
                else
                  echo "$NAME exists"
                  docker start "$NAME" >/dev/null 2>&1 || true
                fi
              done

              docker compose stop $SERVICE || true
              docker rm -f "$APP_NAME" || true

              # --no-deps: db/mongo handled above, never recreated here
              docker compose up --build -d --force-recreate --no-deps $SERVICE
            '''
          }
        }
      }
    }
  }

  post {
    always {
      sh 'rm -f backend/.env || true'
      sh 'docker image prune -f || true'
      sh 'docker builder prune -f || true'
      // wipe workspace (checked-out code) after every build; needs ws-cleanup plugin
      cleanWs(deleteDirs: true, disableDeferredWipeout: true)
    }
    success { echo 'Backend deployed' }
    failure { echo 'Backend deploy failed' }
  }
}
