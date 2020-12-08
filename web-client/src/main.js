import {createApp} from 'vue/dist/vue.esm-bundler.js'
import {createRouter, createWebHashHistory} from 'vue-router'

import App from './App.html'
import Home from './Home.html'
import Setup from './Setup.html'
import Profile from './Profile.html'
import Note from './Note.html'
import List from './List.html'
import Publish from './Publish.html'
import Name from './Name.html'

import store from './store'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {path: '/', component: Home},
    {path: '/setup', component: Setup},
    {path: '/:key', component: Profile},
    {path: '/n/:id', component: Note}
  ]
})

const app = createApp({})

app.use(router)
app.use(store)
app.component('App', App)
app.component('Home', Home)
app.component('Setup', Setup)
app.component('Profile', Profile)
app.component('Note', Note)
app.component('List', List)
app.component('Publish', Publish)
app.component('Name', Name)
app.mount('#app')
