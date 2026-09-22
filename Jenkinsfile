pipeline {
    agent any

    environment {
        IMAGE_NAME = 'athletia-frontend'
        CONTAINER_NAME = 'athletia-frontend-container'
        APP_PORT = '8081'
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Verify Environment') {
            steps {
                sh 'docker --version'
            }
        }

        stage('Install, Test & Build') {
            steps {
                sh """
                    docker run --rm --user \$(id -u):\$(id -g) -e HOME=/tmp -v jenkins_home:/var/jenkins_home -w ${WORKSPACE} node:22-alpine sh -c \"npm ci && npm run test:coverage -- --run && npm run build\"
                """
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME} ."
            }
        }

        stage('Deploy Application') {
            steps {
                sh """
                    docker rm -f ${CONTAINER_NAME} || true
                    docker run -d --name ${CONTAINER_NAME} -p ${APP_PORT}:80 ${IMAGE_NAME}
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                sh "sleep 3 && wget -qO- http://localhost:${APP_PORT}/ > /dev/null"
            }
        }
    }

    post {
        always {
            sh "docker logs ${CONTAINER_NAME} || true"
        }
    }
}