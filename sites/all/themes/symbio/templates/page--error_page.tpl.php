<div class="off-canvas-wrap docs-wrap" data-offcanvas="">
  <div class="inner-wrap">
    <main id="main-wrapper">
      <?php include ($directory."/partials/header.php"); ?>
    <?php if(!drupal_is_front_page()):?>
      <?php include ($directory."/partials/masthead.php"); ?>
      <section class="regular-page" itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
        <div class="row">
          <div class="column" itemprop="text">
            <?php if ($messages): ?>
            <?php print $messages; ?>
            <?php endif; ?>
            <?php if ($tabs): ?>
            <div class="tabs">
              <?php print render($tabs); ?>
            </div>
            <?php endif; ?>
            <figure><img src="<?php print $base_path; ?><?php print $directory; ?>/assets/img/images/error.jpg" alt="Error"></figure>
            <?php if ($page['content']): ?>
            <?php print render($page['content']); ?>
            <?php endif; ?>
          </div>
        </div>
      </section>
      <?php if ($page['search']): ?>
      <section id="search-box">
        <?php print render($page['search']); ?>
      </section>
      <?php endif; ?>
    <?php endif;?>
    </main>
    <?php include ($directory."/partials/footer.php"); ?>
    <a class="exit-off-canvas"></a>
  </div>
</div>