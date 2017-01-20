<!doctype html<?php print $rdf_header; ?>>
<html class="no-js" lang="<?php print $language->language ?>" dir="<?php print $language->dir ?>"<?php print $rdf_namespaces; ?> itemscope itemtype="http://schema.org/WebSite">
  <head<?php print $rdf_profile?>>
    <title><?php print $head_title; ?></title>
    <?php print $head; ?>
    <?php print $styles; ?>
  </head>
  <body class="<?php print $classes; ?>" <?php print $attributes;?> itemscope itemtype="http://schema.org/WebPage">
    <?php include ($directory."/partials/svg.php"); ?>
    <div id="skip-link">
      <a href="#main-content" class="element-invisible element-focusable"><?php print t('Skip to main content'); ?></a>
    </div>
    <?php print $page_top; ?>
    <?php include ($directory."/partials/login-header.php"); ?>
    <main id="main-content" class="login-body" itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
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
              <p><?php print $content; ?></p>
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