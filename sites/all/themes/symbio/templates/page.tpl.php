<div class="off-canvas-wrap docs-wrap" data-offcanvas="">
  <div class="inner-wrap">
    <main id="main-wrapper">
      <?php include ($directory."/partials/header.php"); ?>
      <?php if(drupal_is_front_page()):?>
        <?php print render($page['content']); ?>
      <?php endif; ?>
    <?php if(!drupal_is_front_page()):?>
      <?php include ($directory."/partials/masthead.php"); ?>
      <?php if ($page['search']): ?>
      <section id="search-box">
        <?php print render($page['search']); ?>
      </section>
      <?php endif; ?>
      <section class="regular-page" itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
        <div class="row">
          <div class="column" itemprop="text">
          <?php if ($messages): ?>
            <?php print $messages; ?>
          <?php endif; ?>
          <?php if (arg(0) == 'user' && is_numeric(arg(1)) && (arg(2) == NULL) ){ ?>
            <header class="major-header">
              <h2><?php print $title; ?></h2>
            </header>
          <?php } else { ?>
            <?php if ($tabs): ?>
            <div class="tabs">
              <?php print render($tabs); ?>
            </div>
            <?php endif; ?>
          <?php } ?>
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