(function runApp() {
  'use strict';

  var tutors = [
    {
      id: 'maya-thompson',
      name: 'Maya Thompson',
      photo: 'assets/tutors/maya-thompson.webp',
      photoAlt: 'Maya Thompson, a fictional ABC Tutoring tutor',
      qualification: 'M.Ed. in Mathematics Education',
      bio: 'Maya makes challenging ideas feel manageable through patient explanations and practical examples tailored to each student.',
      coverage: { Mathematics: [4,5,6,7,8,9,10,11,12], Science: [6,7,8,9,10] },
      grades: 'Grades 4–12',
      rate: 48,
      formats: ['online', 'in-person'],
      area: 'Downtown and Westside',
      slots: [
        { offset: 1, time: '4:00 PM' }, { offset: 1, time: '5:30 PM' },
        { offset: 3, time: '10:00 AM' }, { offset: 4, time: '4:30 PM' }
      ]
    },
    {
      id: 'daniel-kim',
      name: 'Daniel Kim',
      photo: 'assets/tutors/daniel-kim.webp',
      photoAlt: 'Daniel Kim, a fictional ABC Tutoring tutor',
      qualification: 'B.A. in English · Teaching credential',
      bio: 'Daniel helps students become confident readers and writers with clear structure, thoughtful feedback, and encouraging practice.',
      coverage: { English: [4,5,6,7,8,9,10,11,12], History: [6,7,8,9,10,11,12] },
      grades: 'Grades 4–12',
      rate: 42,
      formats: ['online'],
      area: null,
      slots: [
        { offset: 2, time: '3:30 PM' }, { offset: 2, time: '5:00 PM' },
        { offset: 4, time: '11:00 AM' }, { offset: 6, time: '4:00 PM' }
      ]
    },
    {
      id: 'alex-rivera',
      name: 'Alex Rivera',
      photo: 'assets/tutors/alex-rivera.webp',
      photoAlt: 'Alex Rivera, a fictional ABC Tutoring tutor',
      qualification: 'M.S. in Biology · 8 years tutoring',
      bio: 'Alex connects science and math to real life, helping students build durable problem-solving habits and prepare calmly for exams.',
      coverage: { Science: [8,9,10,11,12], Mathematics: [8,9,10,11,12] },
      grades: 'Grades 8–12',
      rate: 55,
      formats: ['online', 'in-person'],
      area: 'Northside and Central',
      slots: [
        { offset: 1, time: '6:00 PM' }, { offset: 3, time: '3:00 PM' },
        { offset: 5, time: '9:30 AM' }, { offset: 6, time: '1:00 PM' }
      ]
    }
  ];

  var state = {
    subject: '',
    grade: null,
    tutor: null,
    slot: null,
    details: null,
    bookingFormTracked: false
  };

  var bookedStorageKey = 'abc-tutoring-booked-slots-v1';

  var elements = {
    searchForm: document.getElementById('search-form'),
    subject: document.getElementById('subject'),
    grade: document.getElementById('grade'),
    results: document.getElementById('results'),
    resultsSummary: document.getElementById('results-summary'),
    tutorGrid: document.getElementById('tutor-grid'),
    noResults: document.getElementById('no-results'),
    schedule: document.getElementById('schedule'),
    selectedTutorSummary: document.getElementById('selected-tutor-summary'),
    slotGrid: document.getElementById('slot-grid'),
    booking: document.getElementById('booking'),
    bookingForm: document.getElementById('booking-form'),
    formatOptions: document.getElementById('format-options'),
    liveBookingSummary: document.getElementById('live-booking-summary'),
    review: document.getElementById('review'),
    reviewList: document.getElementById('review-list'),
    confirmation: document.getElementById('confirmation'),
    confirmationList: document.getElementById('confirmation-list'),
    submitError: document.getElementById('submit-error')
  };

  function safeTrack(eventName, properties) {
    var shared = { traffic_source: window.abcTrafficSource || 'direct' };
    window.abcTrack(eventName, Object.assign(shared, properties || {}));
  }

  function getBookedSlots() {
    try {
      var stored = JSON.parse(localStorage.getItem(bookedStorageKey) || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      return [];
    }
  }

  function persistBookedSlot(slotKey) {
    var booked = getBookedSlots();
    if (!booked.includes(slotKey)) booked.push(slotKey);
    localStorage.setItem(bookedStorageKey, JSON.stringify(booked));
  }

  function localDateKey(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function slotDetails(tutor, template) {
    var date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + template.offset);
    var dateKey = localDateKey(date);
    return {
      date: date,
      dateKey: dateKey,
      time: template.time,
      key: tutor.id + '|' + dateKey + '|' + template.time,
      dateLabel: new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(date)
    };
  }

  function gradeLabel(grade) {
    return Number(grade) === 0 ? 'Kindergarten' : 'Grade ' + grade;
  }

  function displayFormat(format) {
    return format === 'in-person' ? 'In person' : 'Online';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function(character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }

  function updateProgress(currentStep) {
    document.querySelectorAll('[data-progress]').forEach(function(item) {
      var step = Number(item.dataset.progress);
      item.classList.toggle('is-active', step === currentStep);
      item.classList.toggle('is-complete', step < currentStep);
      if (step === currentStep) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }

  function scrollToSection(section, headingSelector) {
    section.hidden = false;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var heading = section.querySelector(headingSelector || 'h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      window.setTimeout(function() { heading.focus({ preventScroll: true }); }, 450);
    }
  }

  function hideAfter(step) {
    if (step < 2) elements.results.hidden = true;
    if (step < 3) elements.schedule.hidden = true;
    if (step < 4) {
      elements.booking.hidden = true;
      elements.review.hidden = true;
      elements.confirmation.hidden = true;
    }
  }

  function validateSearch() {
    var valid = true;
    [['subject', elements.subject], ['grade', elements.grade]].forEach(function(pair) {
      var error = document.getElementById(pair[0] + '-error');
      if (!pair[1].value) {
        pair[1].setAttribute('aria-invalid', 'true');
        error.textContent = pair[0] === 'subject' ? 'Choose a subject to continue.' : 'Choose the student’s grade to continue.';
        valid = false;
      } else {
        pair[1].removeAttribute('aria-invalid');
        error.textContent = '';
      }
    });
    return valid;
  }

  function tutorCard(tutor) {
    var formats = tutor.formats.map(displayFormat).join(' & ');
    var subjects = Object.keys(tutor.coverage).map(function(subject) {
      return '<span class="tag">' + subject + '</span>';
    }).join('');
    var areaText = tutor.area ? '<p><strong>Area:</strong> ' + tutor.area + '</p>' : '';

    return '<article class="tutor-card">' +
      '<div class="tutor-photo-wrap"><img class="tutor-photo" src="' + tutor.photo + '" alt="' + tutor.photoAlt + '"></div>' +
      '<div class="tutor-body">' +
        '<div class="tutor-heading"><div><h3>' + tutor.name + '</h3></div><div class="rate">$' + tutor.rate + '<small>per hour</small></div></div>' +
        '<p class="qualification">' + tutor.qualification + '</p>' +
        '<p class="bio">' + tutor.bio + '</p>' +
        '<div class="tag-list" aria-label="Subjects">' + subjects + '</div>' +
        '<div class="tutor-meta"><p><strong>Grades:</strong> ' + tutor.grades + '</p><p><strong>Sessions:</strong> ' + formats + '</p>' + areaText + '</div>' +
        '<button class="button button-primary button-full choose-tutor" type="button" data-tutor-id="' + tutor.id + '">See ' + tutor.name.split(' ')[0] + '’s times</button>' +
      '</div></article>';
  }

  function renderResults(matches) {
    elements.results.hidden = false;
    elements.schedule.hidden = true;
    elements.booking.hidden = true;
    elements.review.hidden = true;
    elements.confirmation.hidden = true;
    elements.tutorGrid.innerHTML = matches.map(tutorCard).join('');
    elements.tutorGrid.hidden = matches.length === 0;
    elements.noResults.hidden = matches.length !== 0;

    if (matches.length) {
      elements.resultsSummary.textContent = matches.length + ' tutor' + (matches.length === 1 ? '' : 's') + ' support ' + state.subject + ' for ' + gradeLabel(state.grade) + '.';
    } else {
      elements.resultsSummary.textContent = 'No current matches for ' + state.subject + ' and ' + gradeLabel(state.grade) + '.';
    }

    document.querySelectorAll('.choose-tutor').forEach(function(button) {
      button.addEventListener('click', function() { chooseTutor(button.dataset.tutorId); });
    });

    updateProgress(2);
    scrollToSection(elements.results);
  }

  function chooseTutor(tutorId) {
    state.tutor = tutors.find(function(tutor) { return tutor.id === tutorId; });
    state.slot = null;
    state.details = null;
    state.bookingFormTracked = false;
    elements.booking.hidden = true;
    elements.review.hidden = true;
    elements.confirmation.hidden = true;

    safeTrack('tutor_profile_viewed', {
      tutor_id: state.tutor.id,
      tutor_name: state.tutor.name,
      subject: state.subject,
      grade: gradeLabel(state.grade)
    });

    renderSchedule();
    updateProgress(3);
    scrollToSection(elements.schedule);
  }

  function renderSchedule() {
    var tutor = state.tutor;
    var areaText = tutor.area ? '<p><strong>Area:</strong> ' + tutor.area + '</p>' : '';
    elements.selectedTutorSummary.innerHTML = '<article class="selected-card">' +
      '<img src="' + tutor.photo + '" alt="' + tutor.photoAlt + '">' +
      '<div class="selected-card-body"><p>Your selected tutor</p><h3>' + tutor.name + '</h3><p>' + tutor.qualification + '</p><p><strong>$' + tutor.rate + '</strong> per one-hour session</p><p>' + tutor.formats.map(displayFormat).join(' & ') + '</p>' + areaText + '</div></article>';

    var booked = getBookedSlots();
    elements.slotGrid.innerHTML = tutor.slots.map(function(template, index) {
      var slot = slotDetails(tutor, template);
      var unavailable = booked.includes(slot.key);
      return '<button class="slot-button" type="button" data-slot-index="' + index + '"' + (unavailable ? ' disabled' : '') + '>' +
        '<strong>' + slot.dateLabel + '</strong><span>' + slot.time + (unavailable ? ' · Booked' : '') + '</span></button>';
    }).join('');

    elements.slotGrid.querySelectorAll('.slot-button:not(:disabled)').forEach(function(button) {
      button.addEventListener('click', function() { chooseSlot(Number(button.dataset.slotIndex)); });
    });
  }

  function chooseSlot(index) {
    state.slot = slotDetails(state.tutor, state.tutor.slots[index]);

    safeTrack('appointment_time_selected', {
      tutor_id: state.tutor.id,
      subject: state.subject,
      grade: gradeLabel(state.grade),
      session_date: state.slot.dateKey,
      session_time: state.slot.time,
      supported_session_formats: state.tutor.formats
    });

    renderBookingForm();
    updateProgress(4);
    scrollToSection(elements.booking);
  }

  function renderBookingForm() {
    elements.review.hidden = true;
    elements.confirmation.hidden = true;
    elements.booking.hidden = false;
    elements.formatOptions.innerHTML = state.tutor.formats.map(function(format) {
      return '<div class="format-option"><input type="radio" name="sessionFormat" id="format-' + format + '" value="' + format + '" required>' +
        '<label for="format-' + format + '"><span class="format-dot" aria-hidden="true"></span>' + displayFormat(format) + '</label></div>';
    }).join('');

    elements.liveBookingSummary.innerHTML = '<h3>Your booking so far</h3><dl>' + summaryRows(null) + '</dl>';

    if (!state.bookingFormTracked) {
      safeTrack('booking_form_started', commonBookingProperties());
      state.bookingFormTracked = true;
    }
  }

  function commonBookingProperties(format) {
    return {
      tutor_id: state.tutor.id,
      tutor_name: state.tutor.name,
      subject: state.subject,
      grade: gradeLabel(state.grade),
      session_format: format || undefined,
      hourly_rate: state.tutor.rate,
      session_date: state.slot.dateKey,
      session_time: state.slot.time
    };
  }

  function summaryRows(format) {
    var rows = [
      ['Tutor', state.tutor.name],
      ['Subject', state.subject + ' · ' + gradeLabel(state.grade)],
      ['Date', state.slot.dateLabel],
      ['Time', state.slot.time],
      ['Format', format ? displayFormat(format) : 'Choose below'],
      ['Expected cost', '$' + state.tutor.rate + ' for one hour']
    ];
    return rows.map(function(row, index) {
      return '<div class="summary-row' + (index === rows.length - 1 ? ' total' : '') + '"><dt>' + row[0] + '</dt><dd>' + row[1] + '</dd></div>';
    }).join('');
  }

  function validateBookingForm() {
    var valid = true;
    var inputs = [
      { element: document.getElementById('parent-name'), message: 'Enter the parent’s name.' },
      { element: document.getElementById('parent-email'), message: 'Enter a valid email address.' },
      { element: document.getElementById('student-name'), message: 'Enter the student’s first name.' }
    ];

    inputs.forEach(function(item) {
      var error = item.element.parentElement.querySelector('.field-error');
      if (!item.element.checkValidity()) {
        item.element.setAttribute('aria-invalid', 'true');
        error.textContent = item.message;
        valid = false;
      } else {
        item.element.removeAttribute('aria-invalid');
        error.textContent = '';
      }
    });

    var format = elements.bookingForm.querySelector('input[name="sessionFormat"]:checked');
    document.getElementById('format-error').textContent = format ? '' : 'Choose online or in person.';
    if (!format) valid = false;

    if (!valid) {
      var firstInvalid = elements.bookingForm.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
    }
    return valid;
  }

  function renderDefinitionList(container, details, includeStudent) {
    var rows = [
      ['Tutor', state.tutor.name],
      ['Subject and grade', state.subject + ' · ' + gradeLabel(state.grade)],
      ['Date', state.slot.dateLabel],
      ['Time', state.slot.time],
      ['Session format', displayFormat(details.format)],
      ['Expected cost', '$' + state.tutor.rate + ' for one hour']
    ];
    if (includeStudent) rows.splice(1, 0, ['Student', escapeHtml(details.studentName)]);
    container.innerHTML = rows.map(function(row) {
      return '<div><dt>' + row[0] + '</dt><dd>' + row[1] + '</dd></div>';
    }).join('');
  }

  function showReview(event) {
    event.preventDefault();
    if (!validateBookingForm()) return;

    var formData = new FormData(elements.bookingForm);
    state.details = {
      parentName: String(formData.get('parentName')).trim(),
      parentEmail: String(formData.get('parentEmail')).trim(),
      studentName: String(formData.get('studentName')).trim(),
      format: String(formData.get('sessionFormat'))
    };

    renderDefinitionList(elements.reviewList, state.details, true);
    safeTrack('booking_review_viewed', commonBookingProperties(state.details.format));
    elements.booking.hidden = true;
    elements.submitError.textContent = '';
    scrollToSection(elements.review);
  }

  function confirmBooking() {
    elements.submitError.textContent = '';
    if (getBookedSlots().includes(state.slot.key)) {
      elements.submitError.textContent = 'That time was just booked. Please choose another available time.';
      safeTrack('booking_conflict_seen', commonBookingProperties(state.details.format));
      return;
    }

    persistBookedSlot(state.slot.key);
    safeTrack('booking_completed', commonBookingProperties(state.details.format));
    renderDefinitionList(elements.confirmationList, state.details, false);
    elements.review.hidden = true;
    scrollToSection(elements.confirmation);
    renderSchedule();
  }

  elements.searchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    if (!validateSearch()) return;

    state.subject = elements.subject.value;
    state.grade = Number(elements.grade.value);
    state.tutor = null;
    state.slot = null;
    state.details = null;
    state.bookingFormTracked = false;

    var matches = tutors.filter(function(tutor) {
      return tutor.coverage[state.subject] && tutor.coverage[state.subject].includes(state.grade);
    });

    var searchProperties = {
      subject: state.subject,
      grade: gradeLabel(state.grade),
      matching_tutor_count: matches.length,
      has_matches: matches.length > 0
    };
    safeTrack('tutor_search_submitted', searchProperties);
    if (!matches.length) safeTrack('tutor_search_no_results', searchProperties);
    renderResults(matches);
  });

  elements.bookingForm.addEventListener('submit', showReview);
  document.getElementById('confirm-booking').addEventListener('click', confirmBooking);

  document.getElementById('change-search').addEventListener('click', function() {
    updateProgress(1);
    hideAfter(1);
    document.getElementById('top').scrollIntoView({ behavior: 'smooth' });
    window.setTimeout(function() { elements.subject.focus(); }, 400);
  });
  document.getElementById('try-again').addEventListener('click', function() {
    document.getElementById('change-search').click();
  });
  document.getElementById('change-tutor').addEventListener('click', function() {
    elements.schedule.hidden = true;
    elements.booking.hidden = true;
    elements.review.hidden = true;
    elements.confirmation.hidden = true;
    updateProgress(2);
    scrollToSection(elements.results);
  });
  document.getElementById('change-time').addEventListener('click', function() {
    elements.booking.hidden = true;
    elements.review.hidden = true;
    elements.confirmation.hidden = true;
    updateProgress(3);
    scrollToSection(elements.schedule);
  });
  document.getElementById('edit-details').addEventListener('click', function() {
    elements.review.hidden = true;
    scrollToSection(elements.booking);
  });
  document.getElementById('new-search').addEventListener('click', function() {
    elements.searchForm.reset();
    state = { subject: '', grade: null, tutor: null, slot: null, details: null, bookingFormTracked: false };
    updateProgress(1);
    hideAfter(1);
    document.getElementById('top').scrollIntoView({ behavior: 'smooth' });
  });

  [elements.subject, elements.grade].forEach(function(select) {
    select.addEventListener('change', function() {
      select.removeAttribute('aria-invalid');
      document.getElementById(select.id + '-error').textContent = '';
    });
  });

  window.addEventListener('storage', function(event) {
    if (event.key === bookedStorageKey && state.tutor && !elements.schedule.hidden) renderSchedule();
  });

  function registerWebMcpTools() {
    if (!document.modelContext || typeof document.modelContext.registerTool !== 'function') return;

    document.modelContext.registerTool({
      name: 'find_tutors',
      title: 'Find matching tutors',
      description: 'Find ABC Tutoring tutors who support a specific subject and grade, and show the same results in the page.',
      inputSchema: {
        type: 'object',
        properties: {
          subject: { type: 'string', enum: ['Mathematics', 'Science', 'English', 'History', 'Spanish'] },
          grade: { type: 'integer', minimum: 0, maximum: 12 }
        },
        required: ['subject', 'grade'],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: function(input) {
        state.subject = input.subject;
        state.grade = input.grade;
        elements.subject.value = input.subject;
        elements.grade.value = String(input.grade);
        var matches = tutors.filter(function(tutor) {
          return tutor.coverage[input.subject] && tutor.coverage[input.subject].includes(input.grade);
        });
        safeTrack('tutor_search_submitted', {
          subject: input.subject,
          grade: gradeLabel(input.grade),
          matching_tutor_count: matches.length,
          has_matches: matches.length > 0,
          interaction_method: 'webmcp'
        });
        if (!matches.length) safeTrack('tutor_search_no_results', {
          subject: input.subject,
          grade: gradeLabel(input.grade),
          matching_tutor_count: 0,
          has_matches: false,
          interaction_method: 'webmcp'
        });
        renderResults(matches);
        return {
          count: matches.length,
          tutors: matches.map(function(tutor) {
            return { id: tutor.id, name: tutor.name, hourlyRate: tutor.rate, formats: tutor.formats };
          })
        };
      }
    });
  }

  var config = window.ABC_CONFIG || {};
  var contactEmail = config.contactEmail || 'hello@abctutoring.example';
  document.querySelectorAll('.contact-email-link').forEach(function(link) {
    link.href = 'mailto:' + contactEmail;
    if (!link.textContent.trim() || link.closest('.confirmation-help')) link.textContent = contactEmail;
  });
  document.getElementById('year').textContent = new Date().getFullYear();
  registerWebMcpTools();
})();
