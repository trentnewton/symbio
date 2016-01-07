<?php

// Used in conjunction with https://gist.github.com/1417914

/**
* Implements hook_preprocess_html().
*/
function symbio_preprocess_html(&$vars) {
// Move JS files "$scripts" to page bottom for perfs/logic.
// Add JS files that *needs* to be loaded in the head in a new "$head_scripts" scope.
// For instance the Modernizr lib.
  $path = drupal_get_path('theme', 'symbio');
  $vars['site_name'] = variable_get('site_name', 'Default');
}

/**
* Implements hook_process_html().
*/
function symbio_process_html(&$vars) {
  $vars['head_scripts'] = drupal_get_js('head_scripts');
}

// Remove Drupal core css

function symbio_css_alter(&$css) { 
  unset($css[drupal_get_path('module','system').'/system.theme.css']);
  unset($css[drupal_get_path('module','system').'/system.messages.css']);
  unset($css[drupal_get_path('module','system').'/system.menus.css']);
  unset($css[drupal_get_path('module','search').'/search.css']);
}

function symbio_js_alter(&$js) {
 
  // Remove Drupal core js

  // global $user;
  // if (!in_array('administrator', $user->roles)) {
  //   unset($js['settings']);
  // }

  // unset($js['settings']);
 
  $exclude = array(
  // 'sites/all/modules/jquery_update/replace/jquery/1.10/jquery.min.js' => TRUE,
  // 'sites/all/modules/jquery_update/replace/jquery/2.1/jquery.min.js' => TRUE
  'sites/all/modules/jquery_update/js/jquery_update.js' => TRUE,
  'sites/all/modules/jquery_update/replace/jquery.form/3/jquery.form.min.js' => TRUE,
  'sites/all/modules/jquery_update/replace/ui/external/jquery.cookie.js' => TRUE,
  'sites/all/modules/autoupload/js/autoupload.js' => TRUE,
  'sites/all/modules/custom_search/js/custom_search.js' => TRUE,
  'sites/all/modules/devel/devel_krumo_path.js' => TRUE,
  'sites/all/modules/webform/js/webform.js' => TRUE,
  // 'misc/ajax.js' => TRUE,
  'misc/jquery.js' => TRUE,
  // 'misc/jquery.once.js' => TRUE,
  'misc/textarea.js' => TRUE,
  'misc/collapse.js' => TRUE,
  'misc/form.js' => TRUE,
  'misc/progress.js' => TRUE,
  // 'misc/drupal.js' => TRUE,
  );

  $js = array_diff_key($js, $exclude);

}

/**
 * Implements theme_breadrumb().
 *
 * Print breadcrumbs as a list, with separators.
 */
function symbio_breadcrumb($variables) {
  $breadcrumb = $variables['breadcrumb'];

  $breadcrumb = str_replace("active", "current", $breadcrumb);

  if (!empty($breadcrumb)) {
    // Provide a navigational heading to give context for breadcrumb links to
    // screen-reader users. Make the heading invisible with .element-invisible.
    $breadcrumbs = '<h2 class="element-invisible">' . t('You are here') . '</h2>';

    $breadcrumbs .= '<nav class="breadcrumbs">';

    foreach ($breadcrumb as $key => $value) {
      $breadcrumbs .= $value;
    }

    $title = strip_tags(drupal_get_title());
    $breadcrumbs .= '</nav>';

    return $breadcrumbs;
  }

}

/**
 * Implements hook_breadcrumbs_alter().
 */
function symbio_breadcrumb_alter(&$active_trail, $item) {

  // Shifts the first element from the active trail array. We assume that this
  // is the front page.

  if (!drupal_is_front_page()) {
    array_shift($active_trail);
  }

}

// reformat secondary menu (remove ul and li's)

function symbio_links__system_secondary_menu($variables) {
$link = $variables['links'];

  $html = "\n";

  foreach ($variables['links'] as $link) {


  $html .= l($link['title'], $link['href'], $link);
  }

  return $html;
}

// adding content type template overide

function symbio_preprocess_page(&$vars, $hook) {

  if (isset($vars['node']->type)) {
    // If the content type's machine name is "my_machine_name" the file
    // name will be "page--my-machine-name.tpl.php".
    $vars['theme_hook_suggestions'][] = 'page__' . $vars['node']->type;
  }

  if (drupal_is_front_page()) {
    unset($vars['page']['content']['system_main']['default_message']); //will remove message "no front page content is created"
  }

  drupal_add_js(drupal_get_path('theme', 'symbio') .'/assets/js/min/app-min.js', array(
  'type' => 'file',
  'requires_jquery' => TRUE,
  'group' => JS_LIBRARY,
  'every_page' => TRUE,
  'weight' => 4,
  ));

}

// styling and formatting of forms

/**
 * Implementation of hook_init().
 */
function symbio_init() {
  // Make sure that the user is not logged in.
  global $user;

  if (!$user->uid) {
    // We need to collect where they were going in the first place because they may get annoyed if 
    // they don't get there after logging in :).
    $destination = '';
    if (isset($_GET['destination'])) {
      $destination = drupal_get_destination();
    }
    else if (isset($_GET['q'])) {
      $destination = array('destination' => $_GET['q']);
    }

    // If this site is set to private we want to redirect all anonymous users to the login form.
    if (variable_get('symbio_private')) {
      // Because of Drush we only want to block anything not from CLI.
      if (arg(0) !== 'user' && php_sapi_name() !== 'cli') {
        drupal_goto('user/login', array('query' => $destination));
      }
    }
  
    // Make sure that anon users cannot go to just /user but directly to the login form.
    if (arg(0) == 'user' && !arg(1) && php_sapi_name() !== 'cli') {
      if (isset($destination)) {
        unset($_GET['destination']);
      }

      drupal_goto('user/login', array('query' => $destination));
    }
  }
}

/**
 * Implementation of hook_form_alter().
 *
 * Some proper page titles would be nice for a change.. User account is a bit boring..
 */
function symbio_form_alter(&$form, &$form_state, $form_id) {
  // Autofocus on the username field.
  // And add some pretty CSS :).
  // And a few other things too...
  if ($form_id == 'user_login' || $form_id == 'user_register_form' || $form_id == 'user_pass' || $form_id == 'user_pass_reset') {

    // We don't really need descriptions to tell us what we already know...
    unset($form['name']['#description']);
    unset($form['pass']['#description']);

  }

  switch ($form_id) {
    case 'user_login':
      drupal_set_title(t('Log in'));
      $form['#action'] = base_path() . 'user/login';
      $form['name']['#prefix'] ='<div class="column">';
      $form['name']['#attributes']['placeholder'] = t('Username');
      $form['name']['#suffix'] ='</div>';
      $form['pass']['#prefix'] ='<div class="column">';
      $form['pass']['#attributes']['placeholder'] = t('Password');
      $form['pass']['#suffix'] ='</div>';
      $form['actions']['submit'] = array
      (
        '#prefix' => '<div class="column submit-area"><div class="row"><div class="medium-push-6 medium-6 columns"><button type="submit" name="op" class="button expanded"><svg class="icon icon-lock"><use xlink:href="#icon-lock"></use></svg>&nbsp;' . t('Log In'),
        '#type' => 'submit',
        '#value' => '',
        '#attributes' => array( 'style' => array( 'display: none' )), // hide the input field
        '#suffix' => '</button></div><div class="medium-pull-6 medium-6 columns form-link">' . l(t('Forgot your password?'), 'user/password') . '</div></div></div>',
      );
      break;

    case 'user_register_form':
      drupal_set_title(t('Register'));
      
      // The registration form behaves differently...
      $form['account']['name']['#attributes']['autofocus'] = 'autofocus';
      break;

    case 'user_pass':
      drupal_set_title(t('Forgot your password?'));
      $form['#action'] = base_path() . 'user/password';
      $form['name']['#prefix'] ='<div class="column">';
      $form['name']['#attributes']['placeholder'] = t('Username or e-mail address');
      $form['name']['#suffix'] ='</div>';
      $form['actions']['submit'] = array
      (
        '#prefix' => '<div class="column submit-area"><div class="row"><div class="medium-push-4 medium-8 columns"><button type="submit" name="op" class="button expanded"><svg class="icon icon-mail"><use xlink:href="#icon-mail"></use></svg>&nbsp;' . t('Email New Password'),
        '#type' => 'submit',
        '#value' => '',
        '#attributes' => array( 'style' => array( 'display: none' )), // hide the input field
        '#suffix' => '</button></div><div class="medium-pull-8 medium-4 columns form-link"><a href="' . base_path() . 'user/login"><svg class="icon icon-login"><use xlink:href="#icon-login"></use></svg>&nbsp;' . t('Login') . '</a></div></div></div>',
      );
      break;

    case 'user_pass_reset':
      drupal_set_title(t('Reset password'));
      $form['actions']['submit'] = array
      (
        '#prefix' => '<button type="submit" name="op">' . t('Log In'),
        '#type' => 'submit',
        '#value' => '',
        '#attributes' => array( 'style' => array( 'display: none' )), // hide the input field
        '#suffix' => '</button>',
      );
      break;
  }

  if ($form_id == 'custom_search_blocks_form_2') {
    $form['#attributes']['class'][] = 'expanding-search';
    $form['custom_search_blocks_form_2']['#prefix'] = '<svg class="icon icon-search"><use xlink:href="#icon-search"></use></svg>';
    $form['custom_search_blocks_form_2']['#attributes']['class'][] = 'expanding-search-input';
  }

  if ($form_id == 'search_form') {
    $form['#attributes']['class'][] = 'search-form-custom';
    $form['basic']['keys']['#prefix'] = '<div class="row"><div class="small-7 medium-10 columns">';
    $form['basic']['keys']['#attributes']['placeholder'] = t('Search');
    $form['basic']['keys']['#attributes']['class'][] = 'radius';
    $form['basic']['keys']['#suffix'] = '</div>';
    $form['basic']['submit'] = array
    (
      '#prefix' => '<div class="small-5 medium-2 columns"><button type="submit" name="op" class="postfix">' . t('Go'),
      '#type' => 'submit',
      '#value' => '',
      '#attributes' => array('style' => array( 'display: none' )), // hide the input field
      '#suffix' => '</button></div>',
    );
  }

  if ($form_id == 'search_block_form') {
    $order = array('search_block_form', 'custom_search_types', 'actions');
    foreach ($order as $key => $value){
      if (isset($form[$value])){
        $form[$value]['#weight'] = $key;
      }
    }
    $form['#attributes']['class'][] = 'search-form-custom';
    $form['search_block_form']['#prefix'] = '<div class="row"><div class="small-7 medium-10 columns"><div class="row collapse postfix-radius"><div class="small-8 medium-9 columns">';
    $form['search_block_form']['#suffix'] = '</div>';
    $form['custom_search_types']['#prefix'] = '<div class="small-4 medium-3 columns">';
    $form['custom_search_types']['#attributes']['class'][] = 'postfix';
    $form['custom_search_types']['#suffix'] = '</div></div></div>';
    $form['actions']['#prefix'] = '<div class="small-5 medium-2 columns">';
    $form['actions']['submit'] = array
    (
      '#prefix' => '<button type="submit" name="op" class="postfix">' . t('Go'),
      '#type' => 'submit',
      '#value' => '',
      '#attributes' => array('style' => array( 'display: none' )), // hide the input field
      '#suffix' => '</button>',
    );
    $form['actions']['#suffix'] = '</div></div>';
  }

}

/**
 * Implementation of hook_theme_registry_alter().
 * Original code from http://drupal.stackexchange.com/a/26796/7542
 */
function symbio_theme_registry_alter(&$theme_registry) {
  $mod_path = drupal_get_path('module', 'symbio');

  $theme_registry_copy = $theme_registry;
  _theme_process_registry($theme_registry_copy, 'phptemplate', 'theme_engine','', $mod_path);
  $theme_registry += array_diff_key($theme_registry_copy, $theme_registry);

  $hooks = array('page');
  foreach ($hooks as $h) {
    if (!isset($theme_registry[$h]['theme paths'])) { 
      $theme_registry[$h]['theme paths'] = array(); 
    }

    _symbio_insert_after_first_element($theme_registry[$h]['theme paths'], $mod_path);
  }
}

function _symbio_insert_after_first_element(&$a, $element) {
  if (is_array($a)) { 
    $first_element = array_shift($a); 
    if ($first_element) { 
      array_unshift($a, $first_element, $element); 
    } 
    else { 
      array_unshift($a, $element); 
    }
  }
}