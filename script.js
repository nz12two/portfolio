document.addEventListener('DOMContentLoaded', function () {

  // ===================================================================
  // NAV
  // ===================================================================
  var nav = document.querySelector('.nav')
  var navToggle = document.querySelector('.nav-toggle')
  var navMenu = document.querySelector('.nav-menu')
  var navLinks = document.querySelectorAll('.nav-link')

  window.addEventListener('scroll', function () {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60)

    var current = ''
    document.querySelectorAll('section[id]').forEach(function (sec) {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id
    })
    navLinks.forEach(function (link) {
      if (link) link.classList.toggle('active', link.getAttribute('href') === '#' + current)
    })
  })

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navToggle.classList.toggle('active')
      navMenu.classList.toggle('active')
    })
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (navToggle) navToggle.classList.remove('active')
      if (navMenu) navMenu.classList.remove('active')
    })
  })

  // ===================================================================
  // ROLE CYCLER
  // ===================================================================
  var roleEl = document.getElementById('hero-role')
  if (roleEl) {
    var roles = [
      'Full Stack Developer',
      'Automation Engineer',
      'Bot Creator',
      'System Architect',
      'API Builder',
    ]
    var roleIndex = 0
    var roleInterval = 3200

    function cycleRole() {
      roleIndex = (roleIndex + 1) % roles.length
      var nextRole = roles[roleIndex]
      var i = 0
      roleEl.textContent = ''
      roleEl.classList.add('typing')
      function typeRole() {
        if (i < nextRole.length) {
          roleEl.textContent += nextRole[i]
          i++
          setTimeout(typeRole, 30 + Math.random() * 20)
        } else {
          roleEl.classList.remove('typing')
          setTimeout(cycleRole, roleInterval)
        }
      }
      typeRole()
    }

    // Start cycling after initial display
    setTimeout(cycleRole, 4000)
  }

  // ===================================================================
  // TERMINAL TYPING EFFECT
  // ===================================================================
  var termEl = document.getElementById('hero-terminal')
  if (termEl) {
    var termLines = [
      { text: 'whoami', type: 'cmd' },
      { text: 'NZ — Full Stack & Automation Developer', type: 'out' },
      { text: 'cat /proc/status', type: 'cmd' },
      { text: 'Online — Aceitando projetos', type: 'green' },
    ]

    var currentLine = 0
    var charIndex = 0
    var termText = termEl.querySelector('.term-text')
    var termCursor = termEl.querySelector('.term-cursor')

    function makeNewTermLine() {
      var line = document.createElement('div')
      line.className = 'term-line'
      line.innerHTML = '<span class="term-prompt">$</span><span class="term-text"></span><span class="term-cursor" style="display:none">▊</span>'
      termEl.appendChild(line)
      termText = line.querySelector('.term-text')
      termCursor = line.querySelector('.term-cursor')
    }

    function typeNextChar() {
      if (currentLine >= termLines.length) {
        setTimeout(function () {
          if (termCursor) termCursor.style.display = 'none'
          makeNewTermLine()
          if (termCursor) termCursor.style.display = 'inline'
        }, 400)
        return
      }

      var line = termLines[currentLine]

      if (charIndex === 0) {
        termText.textContent = ''
        termText.className = 'term-text ' + line.type
        if (termCursor) termCursor.style.display = 'inline'
      }

      if (charIndex < line.text.length) {
        termText.textContent += line.text[charIndex]
        charIndex++
        setTimeout(typeNextChar, 20 + Math.random() * 30)
      } else {
        charIndex = 0
        currentLine++
        if (currentLine >= termLines.length) {
          if (termCursor) termCursor.style.display = 'inline'
          return
        }
        var delay = line.type === 'cmd' ? 600 : 300
        setTimeout(function () {
          if (termCursor) termCursor.style.display = 'none'
          makeNewTermLine()
          typeNextChar()
        }, delay)
      }
    }

    // Start typing after a brief delay
    setTimeout(typeNextChar, 800)
  }


  // ===================================================================
  // FAQ
  // ===================================================================
  var faqItems = document.querySelectorAll('.faq-item')
  for (var i = 0; i < faqItems.length; i++) {
    (function (item) {
      var q = item.querySelector('.faq-q')
      if (q) {
        q.addEventListener('click', function () {
          var active = item.classList.contains('active')
          for (var j = 0; j < faqItems.length; j++) {
            faqItems[j].classList.remove('active')
          }
          if (!active) item.classList.add('active')
        })
      }
    })(faqItems[i])
  }

  // ===================================================================
  // STAT COUNTER
  // ===================================================================
  var statEls = document.querySelectorAll('.stat-num[data-num]')
  for (var i = 0; i < statEls.length; i++) {
    (function (el) {
      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          obs.unobserve(el)
          var target = parseInt(el.getAttribute('data-num')) || 0
          var cur = 0
          var step = Math.max(1, Math.floor(target / 40))
          function countUp() {
            cur += step
            if (cur >= target) {
              el.textContent = target + '+'
              return
            }
            el.textContent = cur
            requestAnimationFrame(function () { setTimeout(countUp, 16) })
          }
          countUp()
        }
      }, { threshold: 0.5 })
      obs.observe(el)
    })(statEls[i])
  }

  // ===================================================================
  // SKILL BAR ANIMATION
  // ===================================================================
  var skillBars = document.querySelectorAll('.skill-bar-fill[data-width]')
  if (skillBars.length) {
    var skillObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var bar = entry.target
          var w = parseInt(bar.getAttribute('data-width')) || 0
          bar.style.width = w + '%'
          skillObs.unobserve(bar)
        }
      })
    }, { threshold: 0.3 })
    skillBars.forEach(function (bar) { skillObs.observe(bar) })
  }

  // ===================================================================
  // SCROLL REVEAL
  // ===================================================================
  var revealEls = document.querySelectorAll('.reveal')
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        revealObs.unobserve(entry.target)
      }
    })
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })

  revealEls.forEach(function (el) {
    revealObs.observe(el)
  })

  // ===================================================================
  // BACK TO TOP
  // ===================================================================
  var backTop = document.getElementById('back-top')
  if (backTop) {
    window.addEventListener('scroll', function () {
      backTop.classList.toggle('visible', window.scrollY > 400)
    })
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  // ===================================================================
  // CONTACT
  // ===================================================================
  var cttBtn = document.getElementById('ctt-btn')
  if (cttBtn) {
    cttBtn.addEventListener('click', function () {
      var name = document.getElementById('ctt-name')
      var email = document.getElementById('ctt-email')
      var purpose = document.getElementById('ctt-purpose')
      var message = document.getElementById('ctt-message')
      
      if (!name || !email || !purpose || !message) return
      
      var n = name.value.trim()
      var e = email.value.trim()
      var p = purpose.value
      var m = message.value.trim()
      
      if (!n) {
        name.focus()
        name.style.borderColor = '#ef4444'
        setTimeout(function () { name.style.borderColor = '' }, 2000)
        return
      }
      if (!e || !e.includes('@')) {
        email.focus()
        email.style.borderColor = '#ef4444'
        setTimeout(function () { email.style.borderColor = '' }, 2000)
        return
      }
      if (!m) {
        message.focus()
        message.style.borderColor = '#ef4444'
        setTimeout(function () { message.style.borderColor = '' }, 2000)
        return
      }
      
      var msgs = {
        orcamento: 'Ola! Gostaria de solicitar um orcamento para um projeto.',
        duvida: 'Ola! Tenho uma duvida tecnica.',
        proposta: 'Ola! Gostaria de fazer uma proposta de trabalho.',
        reuniao: 'Ola! Gostaria de agendar uma reuniao.',
        outro: 'Ola! Gostaria de conversar sobre outro assunto.'
      }
      var subject = msgs[p] || msgs.outro
      var body = 'Nome: ' + n + '\nEmail: ' + e + '\n\n' + subject + '\n\n' + m
      window.open(
        'https://mail.google.com/mail/?view=cm&fs=1&to=nzjr123@gmail.com&su=Contato%20-%20Portfolio&body=' + encodeURIComponent(body),
        '_blank'
      )
    })
  }

})
