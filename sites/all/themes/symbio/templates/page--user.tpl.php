<div class="off-canvas-wrap docs-wrap" data-offcanvas="">
  <div class="inner-wrap">
    <main id="main-wrapper">
      <?php include ($directory."/partials/header.php"); ?>
    <?php if(!drupal_is_front_page()):?>
      <section id="masthead">
        <div class="row">
          <div class="column">
            <div class="page-title" data-sr="enter bottom">
              <h1><?php print t('Account'); ?></h1>
            </div>
            <?php if ($tabs): ?>
            <div class="masthead-nav" data-sr="enter bottom wait 0.5s">
              <?php print render($tabs); ?>
            </div>
            <?php endif; ?>
          </div>
        </div>
      </section>
      <?php if ($page['search']): ?>
      <section id="search-box">
        <?php print render($page['search']); ?>
      </section>
      <?php endif; ?>
      <section class="regular-page">
        <div class="row">
          <div class="column">
          <?php if ($messages): ?>
            <?php print $messages; ?>
          <?php endif; ?>
          <header class="major-header">
            <h2><?php print $title; ?></h2>
          </header>
          <?php if ($page['content']): ?>
            <?php print render($page['content']); ?>
          <?php endif; ?>
          </div>
        </div>
      </section>
    <?php endif;?>
    </main>
    <?php include ($directory."/partials/footer.php"); ?>
    <a class="exit-off-canvas"></a>
  </div>
</div>