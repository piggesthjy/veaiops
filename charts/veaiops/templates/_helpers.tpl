{{- define "veaiops.name" -}}
{{- default .Release.Name -}}
{{- end -}}

{{- define "veaiops.namespace" -}}
{{- default .Release.Namespace -}}
{{- end -}}

{{- define "veaiops.common.labels" -}}
  veaiops.io/name: veaiops
{{- end -}}

{{- define "veaiops.backend.labels" -}}
{{- $name := include "veaiops.name" . -}}
{{- if .Values.backend.labels -}}
{{- range $key, $value := .Values.backend.labels -}}
  {{ $key }}: {{ $value }}
{{- end -}}
{{- else -}}
  veaiops.io/app: {{ $name }}-backend
{{- end -}}
{{- end -}}

{{- define "veaiops.chatops.labels" -}}
{{- $name := include "veaiops.name" . -}}
{{- if .Values.chatops.labels -}}
{{- range $key, $value := .Values.chatops.labels -}}
  {{ $key }}: {{ $value }}
{{- end -}}
{{- else -}}
  veaiops.io/app: {{ $name }}-chatops
{{- end -}}
{{- end -}}

{{- define "veaiops.frontend.labels" -}}
{{ $name :=  include "veaiops.name" . }}
{{- if .Values.frontend.labels -}}
{{- range $key, $value := .Values.frontend.labels -}}
  {{ $key }}: {{ $value }}
{{- end -}}
{{- else -}}
  veaiops.io/app: {{ $name }}-frontend
{{- end -}}
{{- end -}}

{{- define "veaiops.intelligentThreshold.labels" -}}
{{ $name :=  include "veaiops.name" . }}
{{- if .Values.intelligentThreshold.labels -}}
{{- range $key, $value := .Values.intelligentThreshold.labels -}}
  {{ $key }}: {{ $value }}
{{- end -}}
{{- else -}}
  veaiops.io/app: {{ $name }}-intelligent-threshold
{{- end -}}
{{- end -}}

{{- define "veaiops.mongodb.connection" -}}
{{- if .Values.mongodb.enabled -}}
{{ include "mongodb.fullname" . }}-mongodb:27017
{{- else -}}
{{ .Values.mongodb.external.host }}
{{- end }}
{{- end }}

{{- define "veaiops.mongodb.username" -}}
{{- if .Values.mongodb.enabled -}}
root
{{- else -}}
{{ .Values.mongodb.external.username }}
{{- end }}
{{- end }}

{{- define "veaiops.mongodb.password" -}}
{{- if .Values.mongodb.enabled -}}
{{ .Values.mongodb.auth.rootPassword }}
{{- else -}}
{{ .Values.mongodb.external.password }}
{{- end }}
{{- end }}

{{- define "veaiops.mongodb.uri" -}}
{{- $username := include "veaiops.mongodb.username" . -}}
{{- $password := include "veaiops.mongodb.password" . -}}
{{- $connection := include "veaiops.mongodb.connection" . -}}
mongodb://{{ $username }}:{{ $password }}@{{ $connection }}/
{{- end -}}

{{- define "veaiops.redis.connection" -}}
{{- if .Values.redis.enabled -}}
redis://{{ printf "%s-redis-master:6379" .Release.Name }}
{{- else -}}
{{ .Values.redis.external.host }}
{{- end }}
{{- end -}}

{{- define "veaiops.backend.image" -}}
{{- $registry := .Values.global.imageRegistry | default .Values.backend.image.registry -}}
{{- $repository := .Values.backend.image.repository -}}
{{- $tag := .Values.backend.image.tag -}}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end -}}

{{- define "veaiops.chatops.image" -}}
{{- $registry := .Values.global.imageRegistry | default .Values.chatops.image.registry -}}
{{- $repository := .Values.chatops.image.repository -}}
{{- $tag := .Values.chatops.image.tag -}}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end -}}

{{- define "veaiops.frontend.image" -}}
{{- $registry := .Values.global.imageRegistry | default .Values.frontend.image.registry -}}
{{- $repository := .Values.frontend.image.repository -}}
{{- $tag := .Values.frontend.image.tag -}}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end -}}

{{- define "veaiops.initial.image" -}}
{{- $registry := .Values.global.imageRegistry | default .Values.initial.image.registry -}}
{{- $repository := .Values.initial.image.repository -}}
{{- $tag := .Values.initial.image.tag -}}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end -}}

{{- define "veaiops.intelligentThreshold.image" -}}
{{- $registry := .Values.global.imageRegistry | default .Values.intelligentThreshold.image.registry -}}
{{- $repository := .Values.intelligentThreshold.image.repository -}}
{{- $tag := .Values.intelligentThreshold.image.tag -}}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end -}}

{{- define "veaiops.intelligentThresholdCron.image" -}}
{{- $registry := .Values.global.imageRegistry | default .Values.intelligentThresholdCron.image.registry -}}
{{- $repository := .Values.intelligentThresholdCron.image.repository -}}
{{- $tag := .Values.intelligentThresholdCron.image.tag -}}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end -}}


{{- define "veaiops.backend.pullSecrets" -}}
{{- $pullSecrets := .Values.global.imagePullSecrets | default .Values.backend.image.pullSecrets -}}
{{- include "common.images.renderPullSecrets" (dict "images" (list .Values.backend.image) "pullSecrets" $pullSecrets "context" $) -}}
{{- end -}}

{{- define "veaiops.chatops.pullSecrets" -}}
{{- $pullSecrets := .Values.global.imagePullSecrets | default .Values.chatops.image.pullSecrets -}}
{{- include "common.images.renderPullSecrets" (dict "images" (list .Values.chatops.image) "pullSecrets" $pullSecrets "context" $) -}}
{{- end -}}

{{- define "veaiops.frontend.pullSecrets" -}}
{{- $pullSecrets := .Values.global.imagePullSecrets | default .Values.frontend.image.pullSecrets -}}
{{- include "common.images.renderPullSecrets" (dict "images" (list .Values.frontend.image) "pullSecrets" $pullSecrets "context" $) -}}
{{- end -}}

{{- define "veaiops.intelligentThreshold.pullSecrets" -}}
{{- $pullSecrets := .Values.global.imagePullSecrets | default .Values.intelligentThreshold.image.pullSecrets -}}
{{- include "common.images.renderPullSecrets" (dict "images" (list .Values.intelligentThreshold.image) "pullSecrets" $pullSecrets "context" $) -}}
{{- end -}}

{{- define "veaiops.initial.pullSecrets" -}}
{{- $pullSecrets := .Values.global.imagePullSecrets | default .Values.initial.image.pullSecrets -}}
{{- include "common.images.renderPullSecrets" (dict "images" (list .Values.initial.image) "pullSecrets" $pullSecrets "context" $) -}}
{{- end -}}

{{- define "veaiops.intelligentThresholdCron.pullSecrets" -}}
{{- $pullSecrets := .Values.global.imagePullSecrets | default .Values.intelligentThresholdCron.image.pullSecrets -}}
{{- include "common.images.renderPullSecrets" (dict "images" (list .Values.intelligentThresholdCron.image) "pullSecrets" $pullSecrets "context" $) -}}
{{- end -}}
