<!DOCTYPE html>
<html class="no-js" lang="<?php print $language->language ?>" dir="<?php print $language->dir ?>">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="HandheldFriendly" content="true">
    <title><?php print $head_title; ?></title>
    <meta name="application-name" content="<?php print $site_name; ?>">
    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="msapplication-TileImage" content="<?php global $base_path; print $base_path; ?><?php print $directory; ?>/assets/img/icons/icon-270x270.png">
    <meta name="theme-color" content="#ffffff">
    <link rel="icon" href="<?php global $base_path; print $base_path; ?><?php print $directory; ?>/assets/img/icons/icon-192x192.png" sizes="192x192">
    <link rel="apple-touch-icon-precomposed" href="<?php global $base_path; print $base_path; ?><?php print $directory; ?>/assets/img/icons/icon-180x180.png">
    <?php print $head; ?>
    <?php
      global $user;
      // Check to see if $user has the administrator role.
      if (in_array('administrator', array_values($user->roles))) {
        print $styles;
      }
    ?>
    <link rel="stylesheet" href="<?php global $base_path; print $base_path; ?><?php print $directory; ?>/assets/css/app.css">
  </head>
  <body class="<?php print $classes; ?>" <?php print $attributes;?> itemscope itemtype="http://schema.org/WebPage">
    <?php include ($directory."/partials/svg.php"); ?>
    <?php print $page_top; ?>
    <?php include ($directory."/partials/login-header.php"); ?>
    <main id="login-body" itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
      <?php if ($title): ?>
      <header class="row column">
        <h1 itemprop="headline"><?php print $title; ?></h1>
      </header>
      <?php endif; ?>
      <article class="row">
        <div class="medium-6 small-centered columns login-form-box-wrapper">
          <div class="login-form-box">
            <div class="row column">
              <?php if ($messages): ?>
              <?php print $messages; ?>
              <?php endif; ?>
              <?php if ($help): ?>
              <div id="help">
                <?php print $help; ?>
              </div>
              <?php endif; ?>
            </div>
            <div class="row column">
              <?php print $content; ?>
            </div>
          </div>
        </div>
      </article>
    </main>
    <?php include ($directory."/partials/login-footer.php"); ?>
    <?php print $scripts; ?>
    <?php print $page_bottom; ?>
  </body>
</html>